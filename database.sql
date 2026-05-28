CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INT,
    skill_name VARCHAR(100),
    description TEXT,
    type VARCHAR(20), -- 'Offer' or 'Request'
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);