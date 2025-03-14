# Setting Up Oracle Database on macOS Using Docker

This guide provides step-by-step instructions for setting up Oracle Database on macOS using Docker.

## Prerequisites

- macOS (tested on macOS 24.3.0)
- Docker Desktop for Mac
- Oracle Instant Client (v23.3.0 or higher)
- Node.js (v18 or higher)

## Step 1: Install Docker Desktop

1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:

```bash
docker --version
```

## Step 2: Pull and Run Oracle Container

1. Pull the Oracle Database container image:

```bash
docker pull container-registry.oracle.com/database/free:latest
```

2. Create and run the Oracle container:

```bash
docker run -d \
  --name oracle-free \
  -p 1521:1521 \
  -e ORACLE_PWD=your_password \
  container-registry.oracle.com/database/free:latest
```

3. Wait for the container to initialize (this may take several minutes). Check logs:

```bash
docker logs oracle-free
```

## Step 3: Install Oracle Instant Client

1. Download Oracle Instant Client for macOS ARM64 (version 23.3.0):

   - Go to [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/macos-intel-x86-downloads.html)
   - Download "Basic Package" (instantclient-basic-macos.arm64-23.3.0.0.0dbru.dmg)

2. Mount and install the DMG file:

   - Double-click the downloaded DMG file
   - Copy the contents to `/Volumes/instantclient-basic-macos.arm64-23.3.0.23.09`

3. Set up environment variables in your shell profile (~/.zshrc):

```bash
export ORACLE_HOME=/Volumes/instantclient-basic-macos.arm64-23.3.0.23.09
export PATH=$ORACLE_HOME:$PATH
export DYLD_LIBRARY_PATH=$ORACLE_HOME
```

4. Create Oracle Network Admin directory:

```bash
mkdir -p ~/oracle/network/admin
```

5. Create tnsnames.ora file:

```bash
echo 'FREEPDB1 =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = FREEPDB1)
    )
  )' > ~/oracle/network/admin/tnsnames.ora
```

## Step 4: Configure Node.js Application

1. Install the Oracle Node.js driver:

```bash
npm install oracledb
```

2. Set up environment variables in your .env file:

```env
ORACLE_USER=system
ORACLE_PASSWORD=your_password
ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1
```

3. Configure the Node.js application to use the Oracle client:

```javascript
const oracledb = require("oracledb");
oracledb.initOracleClient({
  libDir: "/Volumes/instantclient-basic-macos.arm64-23.3.0.23.09",
});
```

## Step 5: Create Database Objects

1. Connect to the database using SQL\*Plus:

```bash
sqlplus system/your_password@//localhost:1521/FREEPDB1
```

2. Create your tables:

```sql
CREATE TABLE greetings (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    greeting VARCHAR2(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

1. **Segmentation Fault**

   - Ensure DYLD_LIBRARY_PATH is set correctly
   - Verify Oracle Instant Client path is correct
   - Check if the instant client version matches your Node.js architecture

2. **Connection Issues**

   - Verify Docker container is running: `docker ps`
   - Check container logs: `docker logs oracle-free`
   - Ensure port 1521 is not blocked by firewall
   - Verify tnsnames.ora configuration

3. **Permission Issues**
   - Ensure proper file permissions for Oracle Instant Client
   - Check network admin directory permissions

### Useful Commands

- Check Docker container status:

```bash
docker ps
docker logs oracle-free
```

- Restart Docker container:

```bash
docker restart oracle-free
```

- Test database connection:

```bash
sqlplus system/your_password@//localhost:1521/FREEPDB1
```

## References

- [Oracle Database Docker Images](https://container-registry.oracle.com)
- [Oracle Instant Client Documentation](https://www.oracle.com/database/technologies/instant-client.html)
- [Node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
