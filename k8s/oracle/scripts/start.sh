#!/bin/bash

# Add container user to /etc/passwd if not already there
if ! whoami &> /dev/null; then
  if [ -w /etc/passwd ]; then
    echo "${USER_NAME:-default}:x:$(id -u):0:${USER_NAME:-default} user:${HOME}:/sbin/nologin" >> /etc/passwd
  fi
fi

# Setup persistent storage structure
ORACLE_PERSIST="/opt/oracle/oradata"
mkdir -p $ORACLE_PERSIST/{admin,network,diag,cfgtoollogs}

# Initialize persistent storage if needed
if [ ! -f "$ORACLE_PERSIST/.initialized" ]; then
    echo "Initializing persistent storage..."
    
    # Copy network configuration if it doesn't exist
    if [ ! -d "$ORACLE_PERSIST/network/admin" ]; then
        mkdir -p "$ORACLE_PERSIST/network/admin"
        cp -r $ORACLE_HOME/network/admin/* "$ORACLE_PERSIST/network/admin/"
        chmod -R g+rw "$ORACLE_PERSIST/network/admin"
    fi

    # Create oratab backup in persistent storage
    cp /etc/oratab "$ORACLE_PERSIST/admin/oratab.orig"
    chmod g+rw "$ORACLE_PERSIST/admin/oratab.orig"

    touch "$ORACLE_PERSIST/.initialized"
fi

# Link network configuration from persistent storage
if [ -d "$ORACLE_PERSIST/network/admin" ]; then
    rm -rf $ORACLE_HOME/network/admin
    ln -sf "$ORACLE_PERSIST/network/admin" $ORACLE_HOME/network/
fi

# Find runOracle.sh
echo "Looking for runOracle.sh..."
POSSIBLE_PATHS=(
    "$ORACLE_HOME/bin/runOracle.sh"
    "/opt/oracle/runOracle.sh"
    "/opt/oracle/scripts/runOracle.sh"
    "/opt/oracle/scripts/setup/runOracle.sh"
)

ORACLE_SCRIPT=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "Found runOracle.sh at $path"
        ORACLE_SCRIPT="$path"
        break
    fi
done

if [ -z "$ORACLE_SCRIPT" ]; then
    echo "Error: Could not find runOracle.sh in any of these locations:"
    printf '%s\n' "${POSSIBLE_PATHS[@]}"
    exit 1
fi

# Start Oracle Database using the found script
echo "Starting Oracle Database using $ORACLE_SCRIPT..."
$ORACLE_SCRIPT &
ORACLE_PID=$!

# Wait for Oracle to be ready
echo "Waiting for Oracle Database to be ready..."
while true; do
    if pgrep -f pmon_$ORACLE_SID > /dev/null; then
        echo "Oracle Database is running"
        break
    fi
    if ! ps -p $ORACLE_PID > /dev/null; then
        echo "Oracle startup process failed"
        exit 1
    fi
    sleep 5
done

# Wait for listener to be ready
echo "Waiting for listener..."
while true; do
    lsnrctl status | grep "Service \"$ORACLE_SID\"" > /dev/null
    if [ $? -eq 0 ]; then
        echo "Listener is ready"
        break
    fi
    sleep 5
done

# Configure database if password is provided
if [ ! -z "$ORACLE_PWD" ]; then
    echo "Configuring database passwords..."
    $ORACLE_HOME/bin/sqlplus / as sysdba << EOF
    ALTER USER SYS IDENTIFIED BY "$ORACLE_PWD";
    ALTER USER SYSTEM IDENTIFIED BY "$ORACLE_PWD";
    ALTER SESSION SET CONTAINER=$ORACLE_PDB;
    ALTER USER PDBADMIN IDENTIFIED BY "$ORACLE_PWD";
    exit;
EOF
fi

# Keep container running
echo "Database is ready"
wait $ORACLE_PID 