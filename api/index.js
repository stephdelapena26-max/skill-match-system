const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();

/* =========================================
   DATABASE CONNECTION (SUPABASE POSTGRES)
========================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 5000
});

/* =========================================
   SAFE DB INIT (DO NOT CRASH VERCEL)
========================================= */

async function initDb() {
  try {
    await pool.query("SELECT 1");
    console.log("DB READY");
  } catch (err) {
    console.log("DB INIT ERROR:", err.message);
  }
}

initDb();

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* =========================================
   ROUTES
========================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* REGISTER */
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`,
      [username, email, password]
    );

    res.json({ success: true });
  } catch (err) {
  console.log("REGISTER ERROR FULL:", err);

  res.json({
    success: false,
    error: err?.message || err.toString()
  });
}
});

/* LOGIN */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT user_id, name FROM users WHERE email=$1 AND password=$2`,
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid login" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("LOGIN ERROR:", err.message);
    res.status(500).json({ error: "Login error" });
  }
});

/* USER DATA */
app.get("/api/user-data", async (req, res) => {
  const { userId } = req.query;

  try {
    const result = await pool.query(
      `SELECT user_id, name AS username, email, bio, pfp_icon FROM users WHERE user_id=$1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Error");
  }
});

/* UPDATE BIO */
app.post("/api/update-bio", async (req, res) => {
  const { bio, userId } = req.body;

  try {
    await pool.query(
      `UPDATE users SET bio=$1 WHERE user_id=$2`,
      [bio, userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* UPDATE PFP */
app.post("/api/update-pfp", async (req, res) => {
  const { pfp_icon, userId } = req.body;

  try {
    await pool.query(
      `UPDATE users SET pfp_icon=$1 WHERE user_id=$2`,
      [pfp_icon, userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* ADD POST */
app.post("/add-post", async (req, res) => {
  const { user_id, post_type, skill_name, description } = req.body;

  try {
    await pool.query(
      `INSERT INTO skills (user_id, type, skill_name, description)
       VALUES ($1, $2, $3, $4)`,
      [user_id, post_type, skill_name, description]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* SEARCH SKILLS */
app.get("/api/search-skills", async (req, res) => {
  const query = req.query.query || "";

  try {
    const result = await pool.query(
      `SELECT skill_id AS post_id, user_id, type AS post_type, skill_name, description
       FROM skills
       WHERE skill_name ILIKE $1 OR description ILIKE $1
       ORDER BY skill_id DESC`,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

/* DELETE POST */
app.delete("/api/delete-post/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    await pool.query(
      `DELETE FROM skills WHERE skill_id=$1`,
      [postId]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* CONTACTS */
app.get("/api/my-contacts", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name AS username, pfp_icon FROM users ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

/* SEND MESSAGE */
app.post("/api/reply-message", async (req, res) => {
  const { message_text, receiverId, senderId } = req.body;

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3)`,
      [senderId, receiverId, message_text]
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* GET MESSAGES */
app.get("/api/get-messages", async (req, res) => {
  const { sender, receiver } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id=$1 AND receiver_id=$2)
       OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY message_id ASC`,
      [sender, receiver]
    );

    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

/* =========================================
   EXPORT (VERCEL REQUIRED)
========================================= */

module.exports = app;