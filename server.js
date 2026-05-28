const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

const pool = new Pool({
  connectionString: 'postgresql://postgres.wotzqohzupzsilmtuehb:S6WPvBtt4Zncm0Q8@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
});const pool = new Pool({
  connectionString: 'postgresql://postgres.wotzqohzupzsilmtuehb:S6WPvBtt4Zncm0Q8@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false // Ito ang mag-aalis ng "self-signed certificate" error
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [username, email, password]);
    res.send('<script>alert("Registration Successful!"); window.location.href = "/";</script>');
  } catch (err) {
    res.status(500).send("DB Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));