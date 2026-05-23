/* User Table - From User Class */
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

/* Skill Table - 1:N Relationship with User */
CREATE TABLE skills (
    skill_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    skill_name VARCHAR(100),
    description TEXT,
    type VARCHAR(20), -- 'Offer' or 'Request'
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);