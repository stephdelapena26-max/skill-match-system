const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// 1. Dynamic Database Connection (Uses Vercel environment variables live)
const isProduction = process.env.ENVIRONMENT === 'PRODUCTION';

const pool = new Pool({
    user: 'postgres',
    host: 'aws-0-ap-northeast-1.pooler.supabase.com', 
    database: 'postgres',
    password: 'S6WPvBtt4Zncm0Q8', 
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// CLOUD INITIALIZER: This bypasses your home internet wall and runs directly inside Vercel's network!
async function initDb() {
    console.log("🔄 Vercel running database initialization tasks...");
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
        console.log("🎉 SUCCESS: All database tables are fully deployed and ready on Render!");
    } catch (err) {
        console.error("❌ Database schema migration failed:", err.message);
    }
}

// Automatically trigger table creation on startup
initDb();

// 2. Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); 
});

// 3. Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT user_id, name FROM users WHERE email = $1 AND password = $2', 
            [email, password]
        );
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.send(`
                <script>
                    localStorage.setItem('userId', '${user.user_id}');
                    localStorage.setItem('username', '${user.name}');
                    window.location.href = '/dashboard.html';
                </script>
            `);
        } else {
            res.send('Invalid email or password.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 4. Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [username, email, password]
        );
        res.send('<h1>Registration Successful!</h1><a href="/index.html">Click here to Login</a>');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating account.');
    }
});

// 5. User Data Profile Retrieval
app.get('/api/user-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, name, email FROM users ORDER BY user_id DESC LIMIT 1');
        if (result.rows.length === 0) return res.status(404).send("User not found");
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
    }
});

// 6. Post Creation Engine
app.post('/add-post', async (req, res) => {
    const { post_type, skill_name, description } = req.body;
    try {
        const userRes = await pool.query('SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1');
        if (userRes.rows.length === 0) return res.status(400).send("No users exist to make a post.");
        const userId = userRes.rows[0].user_id;
        
        await pool.query(
            'INSERT INTO skills (user_id, type, skill_name, description) VALUES ($1, $2, $3, $4)',
            [userId, post_type, skill_name, description]
        );
        res.redirect('/dashboard.html'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving post.");
    }
});

// 7. Core Search Query Routing
app.get('/api/search-skills', async (req, res) => {
    const { query } = req.query;
    try {
        const searchQuery = `%${query || ''}%`;
        const result = await pool.query(
            'SELECT * FROM skills WHERE skill_name ILIKE $1 OR description ILIKE $1 ORDER BY skill_id DESC',
            [searchQuery]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

// 8. Delete Post Function
app.delete('/api/delete-post/:postId', async (req, res) => {
    const { postId } = req.params;
    try {
        const result = await pool.query('DELETE FROM skills WHERE skill_id = $1', [postId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting post" });
    }
});

// 9. Load Dynamic Contacts Directory
app.get('/api/my-contacts', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT user_id, name FROM users ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// 12. Submit Reply Message
app.post('/api/reply-message', async (req, res) => {
    const { message_text, receiverId, senderId } = req.body;
    try {
        const queryText = 'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3)';
        const values = [senderId, receiverId, message_text];
        await pool.query(queryText, values);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 13. Get Private Thread History
app.get('/api/get-messages', async (req, res) => {
    const { sender, receiver } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
             OR (sender_id = $2 AND receiver_id = $1) 
             ORDER BY message_id ASC`, 
            [sender, receiver]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch messages error:", err);
        res.status(500).json({ error: "Could not load messages" });
    }
});

module.exports = app;

if (process.env.ENVIRONMENT !== 'PRODUCTION') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    }); 
}