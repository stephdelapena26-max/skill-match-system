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
  ssl: { rejectUnauthorized: false }
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
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING user_id, name`,
      [username, email, password]
    );

    const user = result.rows[0];

    res.send(`
      <script>
        localStorage.setItem('userId', '${user.user_id}');
        localStorage.setItem('username', '${user.name}');
        window.location.href = "/dashboard.html";
      </script>
    `);

  } catch (err) {
    console.log(err);
    res.status(500).send("Register error");
  }
});

/* =========================
   LOGIN
========================= */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT user_id, name FROM users WHERE email=$1 AND password=$2',
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
    console.log(err);
    res.status(500).send("Login error");
  }
});
/* =========================
   🚀 NEW: POSTS (DASHBOARD FEED)
========================= */
app.post('/add-post', async (req, res) => {
  const { post_type, skill_name, description } = req.body;
  const userId = req.body.userId;

  try {
    await pool.query(
      `INSERT INTO skills (user_id, type, skill_name, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, post_type, skill_name, description]
    );

    res.redirect('/dashboard.html');

  } catch (err) {
    console.log(err);
    res.status(500).send("Post error");
  }
});

/* =========================
   🚀 NEW: SEARCH SKILLS (FEED + SEARCH)
========================= */
app.get('/api/search-skills', async (req, res) => {
  const query = req.query.query || '';

  try {
    const result = await pool.query(
      `
      SELECT 
        skills.skill_id,
        skills.skill_name,
        skills.description,
        skills.type,
        skills.user_id,
        users.name,
        users.pfp_icon
      FROM skills
      JOIN users ON skills.user_id = users.user_id
      WHERE skills.skill_name ILIKE $1
      ORDER BY skills.skill_id DESC
      `,
      [`%${query}%`]
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json([]);
  }
});

/* =========================
   🚀 NEW: CONTACTS
========================= */
app.get('/api/my-contacts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, name, pfp_icon FROM users'
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =========================
   🚀 NEW: GET MESSAGES
========================= */
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
    console.error(err);
    res.status(500).json([]);
  }
});

/* =========================
   🚀 NEW: SEND MESSAGE
========================= */
app.post('/api/reply-message', async (req, res) => {
  const { senderId, receiverId, message_text } = req.body;

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3)`,
      [senderId, receiverId, message_text]
    );

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.status(500).send("Message error");
  }
});app.post('/api/reply-message', async (req, res) => {
  const { senderId, receiverId, message_text } = req.body;

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3)`,
      [senderId, receiverId, message_text]
    );

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.status(500).send("Message error");
  }
});

/* =========================
   🚀 NEW: USER PROFILE DATA
========================= */
app.get('/api/user-data', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [req.query.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({});
  }
});

/* =========================
   🚀 NEW: UPDATE BIO
========================= */
app.post('/api/update-bio', async (req, res) => {
  const { userId, bio } = req.body;

  try {
    await pool.query(
      'UPDATE users SET bio = $1 WHERE user_id = $2',
      [bio, userId]
    );

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.status(500).send("Bio error");
  }
});

/* =========================
   🚀 NEW: UPDATE PFP
========================= */
app.post('/api/update-pfp', async (req, res) => {
  const { userId, pfp_icon } = req.body;

  try {
    await pool.query(
      'UPDATE users SET pfp_icon = $1 WHERE user_id = $2',
      [pfp_icon, userId]
    );

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.status(500).send("PFP error");
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});