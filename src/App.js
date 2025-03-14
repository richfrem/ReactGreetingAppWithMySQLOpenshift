import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [greetings, setGreetings] = useState([]);

  useEffect(() => {
    fetchGreetings();
  }, []);

  const fetchGreetings = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/greetings');
      setGreetings(response.data);
    } catch (error) {
      console.error('Error fetching greetings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/greetings', {
        name,
        greeting: `Hello, ${name}!`
      });
      setName('');
      fetchGreetings();
    } catch (error) {
      console.error('Error saving greeting:', error);
    }
  };

  return (
    <div className="App">
      <h1>Greeting App</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <button type="submit">Submit</button>
      </form>
      
      <div className="greetings-list">
        <h2>Previous Greetings</h2>
        {greetings.map((g) => (
          <div key={g.id} className="greeting-item">
            <p>{g.greeting}</p>
            <small>Created at: {new Date(g.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
