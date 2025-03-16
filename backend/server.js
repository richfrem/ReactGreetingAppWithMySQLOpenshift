const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-greetings',  // Service name in OpenShift
  user: process.env.DB_USER,         // From the secret
  password: process.env.DB_PASSWORD, // From the secret
  database: process.env.DB_NAME,     // From the secret
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Get a promise-based pool to use async/await
const promisePool = pool.promise();

// Initialize database
async function initializeDatabase() {
  try {
    // Test the connection
    await promisePool.query('SELECT 1');
    console.log('Connected to MySQL database');
    
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS greetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        greeting TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    
    await promisePool.query(createTableQuery);
    console.log('Greetings table ready');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize the database
initializeDatabase();

// Helper function to execute queries with connection checking
async function executeQuery(query, params = []) {
  try {
    const [results] = await promisePool.query(query, params);
    return { success: true, results };
  } catch (err) {
    console.error('Database query error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      console.log('Attempting to reconnect...');
      await initializeDatabase();
      // Retry the query once
      try {
        const [results] = await promisePool.query(query, params);
        return { success: true, results };
      } catch (retryErr) {
        return { success: false, error: retryErr };
      }
    }
    return { success: false, error: err };
  }
}

// Routes
// POST endpoint to create new greetings in the database
app.post('/api/greetings', async (req, res) => {
  const { name, greeting } = req.body;
  
  const insertQuery = 'INSERT INTO greetings (name, greeting) VALUES (?, ?)';
  const insertResult = await executeQuery(insertQuery, [name, greeting]);
  
  if (!insertResult.success) {
    res.status(500).json({ error: 'Error saving greeting' });
    return;
  }

  const selectQuery = 'SELECT * FROM greetings WHERE id = ?';
  const selectResult = await executeQuery(selectQuery, [insertResult.results.insertId]);
  
  if (!selectResult.success) {
    res.status(500).json({ error: 'Error fetching created greeting' });
    return;
  }

  res.status(201).json(selectResult.results[0]);
});

app.get('/api/greetings', async (req, res) => {
  const query = 'SELECT * FROM greetings ORDER BY created_at DESC';
  const result = await executeQuery(query);
  
  if (!result.success) {
    res.status(500).json({ error: 'Error fetching greetings' });
    return;
  }

  res.json(result.results);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 