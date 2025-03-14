const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Oracle connection configuration
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING
};

console.log('Database config:', {
  user: dbConfig.user,
  connectString: dbConfig.connectString
});

// Initialize Oracle connection pool
let pool;

async function initialize() {
  try {
    // Set Oracle client location
    const clientPath = path.join(process.env.HOME, 'oracle');
    console.log('Oracle client path:', clientPath);
    
    oracledb.initOracleClient({ libDir: clientPath });
    
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 10,
      poolMax: 10,
      poolIncrement: 0
    });
    console.log('Connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle:', err);
    console.error('Error details:', err.message);
    if (err.stack) console.error('Stack trace:', err.stack);
  }
}

// Initialize the connection pool
initialize();

// Routes
// POST endpoint to create new greetings in the database
app.post('/api/greetings', async (req, res) => {
  const { name, greeting } = req.body;
  console.log('Received request:', { name, greeting });
  
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Got database connection');
    
    // Note: In Oracle, we need to handle the ID sequence
    const result = await connection.execute(
      `INSERT INTO greetings (id, name, greeting, created_at) 
       VALUES (greetings_seq.NEXTVAL, :1, :2, SYSTIMESTAMP)
       RETURNING id, name, greeting, created_at INTO :3, :4, :5, :6`,
      [
        name, 
        greeting,
        { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        { type: oracledb.DATE, dir: oracledb.BIND_OUT }
      ],
      { autoCommit: true }
    );
    
    console.log('Insert result:', result);
    
    res.status(201).json({ 
      id: result.outBinds[0], 
      name: result.outBinds[1],
      greeting: result.outBinds[2],
      created_at: result.outBinds[3]
    });
  } catch (err) {
    console.error('Error saving greeting:', err);
    console.error('Error details:', err.message);
    if (err.stack) console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Error saving greeting', details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

app.get('/api/greetings', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Got database connection for GET request');
    
    const result = await connection.execute(
      'SELECT * FROM greetings ORDER BY created_at DESC'
    );
    
    console.log('Select result:', result);
    
    // Convert Oracle rows to plain objects
    const greetings = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      greeting: row[2],
      created_at: row[3]
    }));
    
    res.json(greetings);
  } catch (err) {
    console.error('Error fetching greetings:', err);
    console.error('Error details:', err.message);
    if (err.stack) console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Error fetching greetings', details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

// Cleanup on application shutdown
process.on('SIGINT', async () => {
  try {
    await pool.close();
    console.log('Pool closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing pool:', err);
    process.exit(1);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 