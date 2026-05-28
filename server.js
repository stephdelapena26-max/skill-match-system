const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Use the connection string with SSL configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres.wotzqohzupzsilmtuehb:S6WPvBtt4Zncm0Q8@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Standard query - ensure the column names match your SQL exactly
    const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
    await pool.query(query, [username, email, password]);
    
    res.send('<script>alert("Registration Successful!"); window.location.href = "/index.html";</script>');
  } catch (err) {
    // THIS WILL TELL US THE REAL ERROR INSTEAD OF CRASHING
    console.error("DEBUG ERROR:", err);
    res.status(500).send("Database Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));