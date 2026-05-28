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

/* =========================
   INITIALIZE DATABASE
========================= */

async function initDb() {

 try {

  // USERS TABLE
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

  // SKILLS TABLE
  await pool.query(`
   CREATE TABLE IF NOT EXISTS skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INT,
    type VARCHAR(20),
    skill_name VARCHAR(100),
    description TEXT,

    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
   );
  `);

  // MESSAGES TABLE
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

initDb();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', async (req, res) => {

 const { username, email, password } = req.body;

 try {

  await pool.query(
   `
   INSERT INTO users
   (name, email, password)
   VALUES ($1, $2, $3)
   `,
   [username, email, password]
  );

  res.send(`
   <script>
    alert("Registration Successful!");
    window.location.href = "/index.html";
   </script>
  `);

 } catch (err) {

  console.error(err);

  res.status(500).send("Registration failed.");

 }
});

app.post('/login', async (req, res) => {

 const { email, password } = req.body;

 try {

  const result = await pool.query(
   `
   SELECT user_id, name
   FROM users
   WHERE email = $1
   AND password = $2
   `,
   [email, password]
  );

  if (result.rows.length === 0) {

   return res.send(`
    <script>
     alert("Invalid email or password.");
     window.location.href = "/index.html";
    </script>
   `);
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

  console.error(err);

  res.status(500).send("Login error.");

 }
});

app.get('/api/user-data', async (req, res) => {

 const userId = req.query.userId;

 try {

  const result = await pool.query(
   `
   SELECT
    user_id,
    name AS username,
    email,
    bio,
    pfp_icon
   FROM users
   WHERE user_id = $1
   `,
   [userId]
  );

  if (result.rows.length === 0) {

   return res.status(404).json({
    error: "User not found"
   });
  }

  res.json(result.rows[0]);

 } catch (err) {

  console.error(err);

  res.status(500).json({
   error: "Server error"
  });

 }
});

app.post('/api/update-bio', async (req, res) => {

 const { bio, userId } = req.body;

 try {

  await pool.query(
   `
   UPDATE users
   SET bio = $1
   WHERE user_id = $2
   `,
   [bio, userId]
  );

  res.json({
   success: true
  });

 } catch (err) {

  console.error(err);

  res.status(500).json({
   success: false
  });

 }
});

app.post('/api/update-pfp', async (req, res) => {

 const { pfp_icon, userId } = req.body;

 try {

  await pool.query(
   `
   UPDATE users
   SET pfp_icon = $1
   WHERE user_id = $2
   `,
   [pfp_icon, userId]
  );

  res.json({
   success: true
  });

 } catch (err) {

  console.error(err);

  res.status(500).json({
   success: false
  });

 }
});

app.post('/add-post', async (req, res) => {

 const {
  user_id,
  post_type,
  skill_name,
  description
 } = req.body;

 try {

  await pool.query(
   `
   INSERT INTO skills
   (user_id, type, skill_name, description)

   VALUES ($1, $2, $3, $4)
   `,
   [
    user_id,
    post_type,
    skill_name,
    description
   ]
  );

  res.redirect('/dashboard.html');

 } catch (err) {

  console.error(err);

  res.status(500).send("Post failed.");

 }
});

app.get('/api/search-skills', async (req, res) => {

 const { query } = req.query;

 try {

  const searchQuery = `%${query || ''}%`;

  const result = await pool.query(
   `
   SELECT
    skill_id AS post_id,
    user_id,
    type AS post_type,
    skill_name,
    description

   FROM skills

   WHERE
    skill_name ILIKE $1
    OR description ILIKE $1

   ORDER BY skill_id DESC
   `,
   [searchQuery]
  );

  res.json(result.rows);

 } catch (err) {

  console.error(err);

  res.status(500).json({
   error: "Search failed"
  });

 }
});


app.delete('/api/delete-post/:postId', async (req, res) => {

 const { postId } = req.params;

 try {

  const result = await pool.query(
   `
   DELETE FROM skills
   WHERE skill_id = $1
   `,
   [postId]
  );

  if (result.rowCount === 0) {

   return res.status(404).json({
    success: false
   });
  }

  res.json({
   success: true
  });

 } catch (err) {

  console.error(err);

  res.status(500).json({
   success: false
  });

 }
});

app.get('/api/my-contacts', async (req, res) => {

 try {

  const result = await pool.query(
   `
   SELECT
    user_id,
    name AS username,
    pfp_icon
   FROM users
   ORDER BY name ASC
   `
  );

  res.json(result.rows);

 } catch (err) {

  console.error(err);

  res.status(500).json([]);

 }
});

app.post('/api/reply-message', async (req, res) => {

 const {
  message_text,
  receiverId,
  senderId
 } = req.body;

 try {

  await pool.query(
   `
   INSERT INTO messages
   (sender_id, receiver_id, message_text)

   VALUES ($1, $2, $3)
   `,
   [
    senderId,
    receiverId,
    message_text
   ]
  );

  res.json({
   success: true
  });

 } catch (err) {

  console.error(err);

  res.status(500).json({
   success: false
  });

 }
});

app.get('/api/get-messages', async (req, res) => {

 const { sender, receiver } = req.query;

 try {

  const result = await pool.query(
   `
   SELECT *
   FROM messages

   WHERE
   (sender_id = $1 AND receiver_id = $2)

   OR

   (sender_id = $2 AND receiver_id = $1)

   ORDER BY message_id ASC
   `,
   [sender, receiver]
  );

  res.json(result.rows);

 } catch (err) {

  console.error(err);

  res.status(500).json({
   error: "Failed loading messages"
  });

 }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log(`Server running on port ${PORT}`);
});