CREATE TABLE IF NOT EXISTS users (

    user_id SERIAL PRIMARY KEY,

    username VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    bio TEXT DEFAULT '',

    pfp_icon VARCHAR(10) DEFAULT '👤',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =========================================
-- SKILLS / POSTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS skills (

    post_id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(user_id)
    ON DELETE CASCADE,

    post_type VARCHAR(50) NOT NULL,

    skill_name VARCHAR(255) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =========================================
-- MESSAGES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS messages (

    message_id SERIAL PRIMARY KEY,

    sender_id INTEGER REFERENCES users(user_id)
    ON DELETE CASCADE,

    receiver_id INTEGER REFERENCES users(user_id)
    ON DELETE CASCADE,

    message_text TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =========================================
-- OPTIONAL TEST DATA
-- REMOVE IF YOU DON'T WANT SAMPLE USERS
-- =========================================

INSERT INTO users
(username, email, password, bio, pfp_icon)

VALUES

(
'Alex',
'alex@gmail.com',
'123456',
'Graphic Designer',
'🎨'
)

ON CONFLICT (email) DO NOTHING;