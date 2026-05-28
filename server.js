const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

const pool = new Pool({
  user: 'postgres',
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  database: 'postgres',
  password: 'S6WPvBtt4Zncm0Q8',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration Route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [username, email, password]
    );
    res.send('<script>alert("Registration Successful!"); window.location.href = "/index.html";</script>');
  } catch (err) {
    res.status(500).send("Database Error: " + err.message + " | Code: " + err.code);
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT user_id, name FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.send('<script>alert("Invalid email or password."); window.location.href = "/index.html";</script>');
    }
    const user = result.rows[0];
    res.send(`<script>localStorage.setItem('userId', '${user.user_id}'); localStorage.setItem('username', '${user.name}'); window.location.href = "/dashboard.html";</script>`);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login error.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});;