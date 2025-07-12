const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL driver

const app = express();
const port = process.env.PORT || 3000;

// --- Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // From Render Environment Variables
  ssl: {
    rejectUnauthorized: false // Required for Render database connections
  }
});

// --- Function to create the users table if it doesn't exist ---
const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL
    );`;
  try {
    await pool.query(createTableQuery);
    console.log("Users table is ready.");
  } catch (error) {
    console.error("Error creating users table:", error);
  }
};

// --- Middleware Setup ---
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-fallback-secret-for-local-dev',
  resave: false,
  saveUninitialized: false,
  proxy: true, 
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  } 
}));

// --- View Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Routes ---

app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserQuery = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    await pool.query(insertUserQuery, [username, hashedPassword]);

    res.status(201).json({ message: 'Account created successfully! You can now log in.' });
  } catch (error) {
    console.error("Signup error:", error);
    // Check for unique violation error (username taken)
    if (error.code === '23505') {
        return res.status(409).json({ error: "Username is already taken." });
    }
    res.status(500).json({ error: "An error occurred during registration." });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const findUserQuery = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(findUserQuery, [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { username: user.username };
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login." });
  }
});

// This route is no longer needed if your frontend is fully separate
// but we'll leave it in case you want to use it later.
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.send(`<h1>Welcome to your dashboard, ${req.session.user.username}</h1>`);
    } else {
        res.status(401).send('Please log in');
    }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  createUsersTable(); // Create table on server start
});