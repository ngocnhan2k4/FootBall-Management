import pool from "../config/database.js";

export async function login(req, res) {
    if (!req.body) {
        return res.status(400).json("Request body is missing");
    }
    const { username, password } = req.body;

    try {
        let result;
        const [[rows]] = await pool.query(
            `SELECT * FROM admin WHERE username = ? AND password = ?`,
            [username, password]
        );
        if (rows) {
            result = "Login success";
            res.status(200).json(result);
        } else {
            result = "Login failure";
            res.status(401).json(result);
        }
    } catch (err) {
        console.error(err.stack);
        res.status(500).json("Something broke!");
    }
}

function generateSchedule(teams) {
    const totalTeams = teams.length;

    // Nếu số đội là lẻ, thêm một đội giả để đảm bảo số đội chẵn
    if (totalTeams % 2 !== 0) {
        teams.push(null); // `null` đại diện cho lượt nghỉ
    }

    const numRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    const rounds = [];

    for (let round = 0; round < numRounds; round++) {
        const roundMatches = [];
        for (let i = 0; i < matchesPerRound; i++) {
            const home = teams[i];
            const away = teams[teams.length - 1 - i];

            if (home && away) {
                roundMatches.push({ home, away });
            }
        }
        rounds.push(roundMatches);

        // Xoay vòng các đội để tạo cặp mới
        teams.splice(1, 0, teams.pop());
    }
    const returnRounds = rounds.map((round) =>
        round.map((match) => ({ home: match.away, away: match.home }))
    );

    return [...rounds, ...returnRounds];
}

function generateSeasonDatetimes(season, count) {
    const timeSlots = ["19:00:00", "20:00:00", "19:30:00"];
    let [year1, year2] = season.split("-").map(Number);

    // Số lượng phần tử cho mỗi nửa mùa giải
    const halfCount = count / 2;
    const datetimes = [];

    // Tạo datetime cho nửa mùa giải đầu tiên (tháng 6 đến tháng 12 của năm đầu)
    for (let i = 0; i < halfCount; i++) {
        const month = Math.floor(Math.random() * 6) + 6; // Chọn ngẫu nhiên tháng từ 6 đến 12
        const day = Math.floor(Math.random() * 28) + 1; // Chọn ngẫu nhiên ngày từ 1 đến 28
        const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        const datetime = `${year1}-${String(month).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")} ${time}`;
        datetimes.push(datetime);
    }

    // Tạo datetime cho nửa mùa giải sau (tháng 1 đến tháng 5 của năm sau)
    for (let i = 0; i < halfCount; i++) {
        const month = Math.floor(Math.random() * 5) + 1; // Chọn ngẫu nhiên tháng từ 1 đến 5
        const day = Math.floor(Math.random() * 28) + 1; // Chọn ngẫu nhiên ngày từ 1 đến 28
        const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        const datetime = `${year2}-${String(month).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")} ${time}`;
        datetimes.push(datetime);
    }

    // Sắp xếp datetimes theo thứ tự thời gian tăng dần
    datetimes.sort((a, b) => new Date(a) - new Date(b));
    return datetimes;
}
export async function createSchedule(req, res) {
    try {
        const season = req.params.season;
        console.log(season);
        const [rows] = await pool.query(`SELECT * FROM team WHERE season = ?`, [
            season,
        ]);
        const teams = rows.map((row) => row.team_id);
        const fixtures = generateSchedule(teams);
        const index = teams.indexOf(null);
        if (index > -1) {
            teams.splice(index, 1);
        }
        const time = generateSeasonDatetimes(
            season,
            (teams.length - 1) * teams.length
        );

        fixtures.forEach(async (round, roundIndex) => {
            round.forEach(async (fixture, index) => {
                const { home, away } = fixture;
                let [[stadium]] = await pool.query(
                    `SELECT home_stadium FROM team WHERE team_id = ?`,
                    [home]
                );
                await pool.query(
                    `INSERT INTO match_schedule (team_1, team_2, season, round,match_time, result, stadium) VALUES (?, ?, ?, ?,?, ?, ?)`,
                    [
                        home,
                        away,
                        season,
                        roundIndex + 1,
                        time[roundIndex * round.length + index],
                        null,
                        stadium.home_stadium,
                    ]
                );
            });
        });
        res.status(201).json("Schedule created");
    } catch (err) {
        console.error(err.stack);
        res.status(500).send("Something broke!");
    }
}
export async function checkNextSeason(req, res) {
    try {
        const [[rows]] = await pool.query(
            `SELECT * FROM season WHERE NOT EXISTS (SELECT * FROM match_schedule as MS WHERE MS.season = season.season)`
        );
        const nextSeason = rows.season;

        const [[numTeamsNextSeasonQuery]] = await pool.query(
            `SELECT COUNT(*) FROM team WHERE season = ?`,
            [nextSeason]
        );
        const numTeamsNextSeason = numTeamsNextSeasonQuery["COUNT(*)"];
        if (numTeamsNextSeason) {
            res.status(200).json({ nextSeason, numTeamsNextSeason });
        } else {
            res.status(404).json("Not enough teams for the next season");
        }
    } catch (err) {
        console.error(err.stack);
        res.status(500).send("Something broke!");
    }
}
