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
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'greeting_db'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
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
    res.status(201).json({ id: results.insertId, name, greeting });
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