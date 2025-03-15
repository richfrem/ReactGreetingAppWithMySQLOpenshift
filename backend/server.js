const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'mysql-greetings',  // Service name in OpenShift
  user: process.env.MYSQL_USER,         // From the secret
  password: process.env.MYSQL_PASSWORD, // From the secret
  database: process.env.MYSQL_DATABASE     // From the secret
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS greetings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      greeting TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('Greetings table ready');
  });
});

// Routes
// POST endpoint to create new greetings in the database
app.post('/api/greetings', (req, res) => {
  const { name, greeting } = req.body;
  
  const query = 'INSERT INTO greetings (name, greeting) VALUES (?, ?)';
  db.query(query, [name, greeting], (err, results) => {
    if (err) {
      console.error('Error saving greeting:', err);
      res.status(500).json({ error: 'Error saving greeting' });
      return;
    }
    // Fetch the created record to get all fields including created_at
    const selectQuery = 'SELECT * FROM greetings WHERE id = ?';
    db.query(selectQuery, [results.insertId], (err, rows) => {
      if (err) {
        console.error('Error fetching created greeting:', err);
        res.status(500).json({ error: 'Error fetching created greeting' });
        return;
      }
      res.status(201).json(rows[0]);
    });
  });
});

app.get('/api/greetings', (req, res) => {
  const query = 'SELECT * FROM greetings ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching greetings:', err);
      res.status(500).json({ error: 'Error fetching greetings' });
      return;
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 