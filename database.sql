CREATE TABLE users (

 user_id SERIAL PRIMARY KEY,
 name VARCHAR(100),
 email VARCHAR(100) UNIQUE,
 password VARCHAR(255),
 bio TEXT DEFAULT '',
 pfp_icon VARCHAR(10) DEFAULT ''
);

CREATE TABLE skills (

 skill_id SERIAL PRIMARY KEY,
 user_id INT,
 type VARCHAR(20),
 skill_name VARCHAR(100),
 description TEXT,
 FOREIGN KEY (user_id)
 REFERENCES users(user_id)
 ON DELETE CASCADE

);

CREATE TABLE messages (

 message_id SERIAL PRIMARY KEY,
 sender_id INT,
 receiver_id INT,
 message_text TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
