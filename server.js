const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

const pool = new Pool({
 user: process.env.DB_USER || 'postgres',
 host: process.env.DB_HOST || 'localhost',
 database: process.env.DB_NAME || 'skill_match_db',
 password: process.env.DB_PASSWORD || 'agua1226',
 port: process.env.DB_PORT || 5432,
 ssl:
  process.env.ENVIRONMENT === 'PRODUCTION'
   ? { rejectUnauthorized: false }
   : false
});

async function initDb() {
 try {
  await pool.query(`
   CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    bio TEXT DEFAULT '',
    pfp_icon VARCHAR(10) DEFAULT ''
   );
  `);

  await pool.query(`
   CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INT,
    type VARCHAR(20),
    skill_name VARCHAR(100),
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
   );
  `);

  await pool.query(`
   CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT,
    receiver_id INT,
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
  `);
  console.log("Database ready.");
 } catch (err) {
  console.error("Database init error:", err);
 }
}

// initDb(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ... (Rest of your routes remain the same) ...

app.post('/register', async (req, res) => {
 const { username, email, password } = req.body;
 try {
  await pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`, [username, email, password]);
  res.send(`<script>alert("Registration Successful!"); window.location.href = "/index.html";</script>`);
 } catch (err) {
  console.error(err);
  res.status(500).send("Registration failed.");
 }
});

app.post('/login', async (req, res) => {
 const { email, password } = req.body;
 try {
  const result = await pool.query(`SELECT user_id, name FROM users WHERE email = $1 AND password = $2`, [email, password]);
  if (result.rows.length === 0) {
   return res.send(`<script>alert("Invalid email or password."); window.location.href = "/index.html";</script>`);
  }
  const user = result.rows[0];
  res.send(`<script>localStorage.setItem('userId', '${user.user_id}'); localStorage.setItem('username', '${user.name}'); window.location.href = "/dashboard.html";</script>`);
 } catch (err) {
  console.error(err);
  res.status(500).send("Login error.");
 }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`Server running on port ${PORT}`);
});