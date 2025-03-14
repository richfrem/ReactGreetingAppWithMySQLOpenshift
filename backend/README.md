# BC Government Greeting Application

A full-stack web application that demonstrates integration between a React frontend and an Oracle database backend, styled with the BC Government theme.

## Project Structure

- `client/` - React frontend application
- `server-oracle.js` - Node.js backend server with Oracle database integration

## Prerequisites

- Node.js (v18 or higher)
- Oracle Instant Client (v23.3.0 or higher)
- Oracle Database

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
ORACLE_USER=system
ORACLE_PASSWORD=your_password
ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1
```

2. Install Oracle Instant Client for your platform

## Installation

### Backend

```bash
npm install
```

### Frontend

```bash
cd client
npm install
```

## Running the Application

1. Start the backend server:

```bash
node server-oracle.js
```

2. Start the frontend development server:

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Features

- BC Government themed interface
- Real-time greeting creation and display
- Oracle database integration
- RESTful API endpoints

## Application Interface

The application features the BC Government theme with a clean, modern interface:

![Application Interface](docs/app-interface.png)

## API Endpoints

- GET `/api/greetings` - Retrieve all greetings
- POST `/api/greetings` - Create a new greeting

## License

[Add appropriate license]
