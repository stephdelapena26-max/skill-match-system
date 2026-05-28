const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

/* =========================
   DATABASE (SUPABASE)
========================= */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: {
    rejectUnauthorized: false
  }
});

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   REGISTER
========================= */

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [username, email, password]
    );

    res.send(`
      <script>
        alert("Registration Successful!");
        window.location.href = "/";
      </script>
    `);

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).send("Registration Error");
  }
});

/* =========================
   LOGIN
========================= */

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT user_id, name FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.send("Invalid login");
    }

    const user = result.rows[0];

    res.send(`
      <script>
        localStorage.setItem('userId', '${user.user_id}');
        localStorage.setItem('username', '${user.name}');
        window.location.href = "/dashboard.html";
      </script>
    `);

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).send("Login error");
  }
});

/* =========================
   START SERVER (LOCAL ONLY)
   (Vercel ignores this automatically)
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});