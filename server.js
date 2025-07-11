const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// ✅ Temporary user "database"
const users = [];

// --- View Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware Setup ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({
  secret: 'a-very-secret-key-that-you-should-change',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// --- Routes ---

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // ✅ Add the new user to our temporary array
  users.push({ username, password });
  console.log('Current users:', users); // See the list grow in your terminal

  res.status(201).json({ message: 'Account created successfully! You can now log in.' });
});

// ✅ MODIFIED LOGIN ROUTE
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find the user in our temporary array
  const user = users.find(u => u.username === username);

  // Check if user exists and if password matches
  if (user && user.password === password) {
    // If successful, create a session for the user
    req.session.user = { username: user.username };
    // Send a success response
    res.status(200).json({ message: 'Login successful' });
  } else {
    // If failed, send an error response
    res.status(401).json({ error: 'Invalid username or password' });
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