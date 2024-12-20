teamscreate database football_management;
use football_management;


CREATE TABLE teams
(
	id integer primary key auto_increment,
    team_name varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci not null,
    stadium varchar(100) not null,
    email varchar(100) not null 
);

CREATE TABLE players
(
	id integer primary key auto_increment,
    player_name varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci not null,
    birth_date date not null,
    player_type varchar(50)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci not null,
    team integer not null,
    note varchar(100)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    CONSTRAINT fk_teams FOREIGN KEY (team) 
                         REFERENCES teams(id)
);

CREATE TABLE standards
(
    id integer primary key auto_increment,
    loai_cau_thu varchar(50)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci not null,
    age_min integer not null,
    age_max integer not null,
    num_max integer not null,
    num_min integer not null,
    foreign_max integer not null
);

INSERT INTO standards (loai_cau_thu,age_min,age_max,num_max,num_min,foreign_max)
Values
(N'Trong nước, Nước ngoài',16,40,15,22,3)


INSERT INTO teams (team_name,stadium, email)
Values 
(N'Đông Lào','Sân Mĩ Đình' ,'donglao@gmail.com');

INSERT INTO players (player_name, birth_date,player_type,team,note)
Values 
(N'Nguyễn Thành Nhật','2004-12-25',N'Tiền Đạo',1,N'Đá bằng tay');