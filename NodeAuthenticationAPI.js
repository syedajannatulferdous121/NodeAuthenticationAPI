// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Create Express app
const app = express();
app.use(bodyParser.json());

// Dummy user data (Replace this with a proper database)
const users = [
  { id: 1, username: 'john', password: 'password123', role: 'user' },
  { id: 2, username: 'jane', password: 'secret456', role: 'admin' }
];

// Secret key for JWT
const secretKey = 'your-secret-key';

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Token-based authentication middleware
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, secretKey);
  res.json({ message: 'Login successful', accessToken });
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) return res.status(409).json({ message: 'Username already exists' });

  // Add user to the database (Not implemented in this example)
  // Return the newly created user object
  const newUser = { id: users.length + 1, username, password, role: 'user' };
  users.push(newUser);

  const accessToken = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, secretKey);
  res.json({ message: 'Signup successful', accessToken });
});

app.get('/dashboard', authenticateToken, (req, res) => {
  // This route requires authentication, and we have the user object from the previous middleware
  res.json({ message: 'Welcome to the dashboard', user: req.user });
});

// Custom middleware to check user roles
function checkRole(role) {
  return (req, res, next) => {
    if (req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  };
}

// Admin-only route
app.get('/admin', authenticateToken, checkRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, Admin!' });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
