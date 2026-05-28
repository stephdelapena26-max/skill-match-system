-- 1. Create the Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

-- 2. Create the Skills table (Linked to users)
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INT,
    skill_name VARCHAR(100),
    description TEXT,
    type VARCHAR(20), -- 'Offer' or 'Request'
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Create the Messages table (REQUIRED FOR CHAT ROUTING)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT,
    receiver_id INT,
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);