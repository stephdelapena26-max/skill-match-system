const { Pool } = require('pg');

const pool = new Pool({
    user: 'skill_match_user',
    host: 'dpg-d8bve3bbc2fs738mlh60-a.onrender.com',
    database: 'skill_match_db',
    password: 'azeKmqyRDdRZzZNqqn6Fxaul6lEYqqn',
    port: 5432,
    ssl: { rejectUnauthorized: false } // Correct object syntax for external SSL handshakes
});

async function runMigration() {
    console.log("🔄 Attempting to connect to Render PostgreSQL cloud...");
    try {
        // 1. Create Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255)
            );
        `);
        console.log("✔ SUCCESS: 'users' table checked/created.");

        // 2. Create Skills Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS skills (
                skill_id SERIAL PRIMARY KEY,
                user_id INT,
                skill_name VARCHAR(100),
                description TEXT,
                type VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);
        console.log("✔ SUCCESS: 'skills' table checked/created.");

        // 3. Create Messages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                message_id SERIAL PRIMARY KEY,
                sender_id INT,
                receiver_id INT,
                message_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✔ SUCCESS: 'messages' table checked/created.");
        console.log("\n🎉 ALL TABLES DEPLOYED SUCCESSFULLY! Your database is fully initialized.");

    } catch (err) {
        console.log("\n❌ CRITICAL ERROR ENCOUNTERED:");
        console.error(err);
    } finally {
        await pool.end();
        console.log("🔌 Connection closed safely.");
    }
}

runMigration();