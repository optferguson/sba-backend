const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt'); // For hashing passwords
const cors = require('cors');     // For enabling cross-origin requests

const app = express();
const port = 3000;

// Temporary user "database"
const users = [];

// --- Middleware Setup ---
app.use(cors()); // Enable CORS for all routes
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({
  // Uses the secret key you set on Render
  secret: process.env.SESSION_SECRET || 'a-fallback-secret-for-local-dev',
  resave: false,
  saveUninitialized: false,
  // Set secure to true for production on HTTPS
  // The 'x-forwarded-proto' header check is needed for Render
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

    if (users.find(user => user.username === username)) {
      return res.status(409).json({ error: "Username is already taken." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the new user to our temporary array with the hashed password
    users.push({ username, password: hashedPassword });
    console.log('Current users:', users);

    res.status(201).json({ message: 'Account created successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: "An error occurred during registration." });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user in our temporary array
    const user = users.find(u => u.username === username);

    // Check if user exists and if password is correct using bcrypt
    if (user && await bcrypt.compare(password, user.password)) {
      // If successful, create a session for the user
      req.session.user = { username: user.username };
      res.status(200).json({ message: 'Login successful' });
    } else {
      // If failed, send an error response
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred during login." });
  }
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.render('dashboard', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});