# React Greeting App with MySQL on OpenShift

A React-based greeting application with MySQL backend, designed for deployment on OpenShift. This application allows users to create and view greetings in real-time, demonstrating a full-stack deployment on OpenShift with persistent storage.

## Screenshot

![Greetings App Screenshot](docs/images/greetings-app-screenshot.png)

The application features the BC Government standard header design and provides a clean, user-friendly interface with:

- A simple form to add new greetings with name and message fields
- Real-time display of submitted greetings
- Chronological listing with timestamps (e.g. "3/15/2025, 8:30:52 PM")
- Responsive design that works across different devices
- Consistent BC Government branding and styling

## Application Architecture

```mermaid
graph TD
    subgraph OpenShift Platform
        subgraph Frontend[Frontend Pod]
            R[React App] --> N[Nginx Proxy]
            style R fill:#61DAFB,stroke:#000,stroke-width:2px
            style N fill:#009639,stroke:#000,stroke-width:2px

            subgraph Nginx Config[Nginx Configuration]
                NJS["/api/* → 10.98.142.109:3001<br>Node.js Backend"]
                NDOT["/api-dotnet/* → 10.98.118.147:3010<br>.NET Backend"]
            end

            N --> NJS
            N --> NDOT
        end

        NJS --> B1[Node.js Backend<br>Express<br>Port 3001]
        NDOT --> B2[.NET Backend<br>Entity Framework<br>Port 3010]

        B1 --> |"10.98.187.196:3306"| D[(MySQL Database)]
        B2 --> |"10.98.187.196:3306"| D

        style Frontend fill:#f5f5f5,stroke:#000,stroke-width:2px
        style B1 fill:#68A063,stroke:#000,stroke-width:2px
        style B2 fill:#512BD4,stroke:#000,stroke-width:2px
        style D fill:#00758F,stroke:#000,stroke-width:2px
        style Nginx Config fill:#f5f5f5,stroke:#000,stroke-width:1px
    end

    classDef platform fill:#DE2E21,stroke:#000,stroke-width:2px
    class OpenShift platform
```

### Service IP Configuration

Due to DNS resolution issues in OpenShift, we need to use service IPs directly. Here's how to get and configure the service IPs:

1. **Get Service IPs**:

```bash
# Get all service IPs
oc get svc
NAME                    CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
greeting-backend       10.98.142.109    <none>        3001/TCP   28h
greeting-backend-dotnet 10.98.118.147   <none>        3010/TCP   8h
mysql-greetings        10.98.187.196    <none>        3306/TCP   28h
```

2. **Update Nginx Configuration**:

```nginx
# Node.js backend proxy (using direct IP)
location /api/ {
    proxy_pass http://10.98.142.109:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# .NET backend proxy (using direct IP)
location /api-dotnet/ {
    proxy_pass http://10.98.118.147:3010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

3. **Testing Backend Connectivity**:

```bash
# Test Node.js backend using IP
oc exec frontend-pod -- curl -v http://10.98.142.109:3001/api/greetings

# Test .NET backend using IP
oc exec frontend-pod -- curl -v http://10.98.118.147:3010/api/greetings

# Test MySQL connectivity from Node.js backend
oc exec nodejs-backend-pod -- curl -v telnet://10.98.187.196:3306

# Test MySQL connectivity from .NET backend
oc exec dotnet-backend-pod -- curl -v telnet://10.98.187.196:3306
```

4. **Update Backend Database Configurations**:

For Node.js backend (`backend/config.js`):

```javascript
module.exports = {
  database: {
    host: "10.98.187.196", // Direct MySQL IP
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
```

For .NET backend (`appsettings.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=10.98.187.196;Port=3306;Database=greeting_db;User=greetinguser;Password=greetingpass;"
  }
}
```

**Note**: When service IPs change (e.g., after service recreation), you'll need to:

1. Get the new service IPs using `oc get svc`
2. Update the Nginx configuration with new IPs
3. Update backend configurations if necessary
4. Restart affected pods to apply changes

## Features

- Create and store greetings with names and messages
- Real-time display of greetings in chronological order
- Persistent storage using MySQL database
- Secure communication between components
- OpenShift-native deployment with auto-scaling support
- Multiple backend implementations:
  - Node.js/Express REST API
  - .NET 8.0 Entity Framework Core REST API
- API selection in frontend UI
- ISO 8601 date format support
- Secure internal communication through network policies

## Frontend Features

### API Selection

The frontend application allows users to switch between the Node.js and .NET backends:

1. **Selection Interface**

   - Radio button group for API selection
   - Visual feedback of current selection
   - Immediate switching between backends

2. **Implementation Details**

   - Uses React state management for API selection
   - Dynamic endpoint configuration based on selection
   - Handles different date formats from each backend
   - Maintains consistent UI regardless of backend

3. **Configuration**

   ```typescript
   // API endpoints configuration
   const API_ENDPOINTS = {
     nodejs: "/api/greetings", // Node.js backend endpoint
     dotnet: "/api-dotnet/greetings", // .NET backend endpoint
   };
   ```

4. **Network Configuration**
   - Nginx proxy routes requests to appropriate backend
   - Network policies allow communication to both backends
   - Health checks ensure backend availability

### Nginx Proxy Configuration

The frontend's Nginx configuration handles routing to both backends:

```nginx
# Node.js backend proxy
location /api/ {
    proxy_pass http://greeting-backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# .NET backend proxy
location /api-dotnet/ {
    proxy_pass http://greeting-backend-dotnet:3010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Project Structure

```
.
├── backend/              # Node.js backend service
│   ├── src/             # Source code
│   ├── tests/           # Unit tests
│   └── Dockerfile       # Node.js backend container build
├── backendDotNetEntity/ # .NET Entity Framework backend service
│   ├── src/            # Source code
│   │   ├── GreetingApi/      # .NET API project
│   │   │   ├── Controllers/  # API endpoints
│   │   │   ├── Models/       # Entity models
│   │   │   └── Data/         # Database context
│   │   └── GreetingApi.Tests/ # .NET API tests
│   └── Dockerfile      # .NET backend container build
├── frontend/           # React frontend application
│   ├── client/        # React application source
│   │   ├── src/      # Source code
│   │   └── public/   # Static assets
│   └── Dockerfile    # Frontend container build
├── k8s/               # Kubernetes/OpenShift configuration files
│   ├── backend/      # Node.js backend deployment configs
│   │   └── manifests/
│   ├── backendDotNetEntity/ # .NET backend deployment configs
│   │   └── manifests/
│   ├── frontend/    # Frontend deployment configs
│   │   └── manifests/
│   └── mysql/       # MySQL deployment configs
│       └── manifests/
└── docs/            # Project documentation
```

## Prerequisites

### Required Tools and Versions

- OpenShift CLI (`oc`) v4.x or higher
- Docker v20.x or higher
- Node.js v18.x or higher (for Node.js backend)
- npm v9.x or higher (for Node.js backend)
- .NET SDK 8.0 or higher (for .NET backend)
- Docker Buildx for multi-architecture builds

### Access Requirements

- Access to BC Government OpenShift cluster
- OpenShift namespace with appropriate roles
- Access to OpenShift's internal registry
- GitHub account with repository access

### Resource Requirements

- Minimum 2 CPU cores available
- Minimum 4GB RAM available
- Minimum 1GB storage for MySQL PVC
- AMD64 architecture support for .NET backend deployment

## Local Development

### 1. Environment Setup

Create the following `.env` files:

**backend/.env:**

```env
DB_HOST=localhost
DB_USER=greetinguser
DB_PASSWORD=greetingpass
DB_NAME=greeting_db
PORT=3001
```

**frontend/.env:**

```env
REACT_APP_API_URL=http://localhost:3001
PORT=3000
```

### 2. Local MySQL Setup

```bash
# Start MySQL (using Docker)
docker run -d \
  --name mysql-greetings \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=greeting_db \
  -e MYSQL_USER=greetinguser \
  -e MYSQL_PASSWORD=greetingpass \
  -p 3306:3306 \
  mysql:8.0

# Create database table
docker exec -i mysql-greetings mysql -ugreetinguser -pgreetingpass greeting_db <<EOF
CREATE TABLE IF NOT EXISTS greetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    greeting TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF
```

### 3. Backend Setup

```bash
cd backend
npm install
npm test        # Run unit tests
npm run dev     # Start in development mode
npm start       # Start in production mode
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm test        # Run unit tests
npm run dev     # Start in development mode
npm start       # Start in production mode
```

### Development vs Production

Development Mode:

- Hot reloading enabled
- Detailed error messages
- Debug logging
- CORS allows localhost

Production Mode:

- Optimized builds
- Minimal error details
- Production logging levels
- Strict CORS settings

## OpenShift Deployment Guide

### 1. Login to OpenShift

```bash
# Login to OpenShift cluster
oc login --token=<your-token> --server=https://api.silver.devops.gov.bc.ca:6443

# Switch to your project
oc project 5b7aa5-dev
```

### 2. Deploy MySQL Infrastructure

#### A. Deployment Steps

1. Create the required resources in order:

```bash
# Create secret with MySQL credentials
oc apply -f k8s/mysql/manifests/mysql-secret.yaml

# Create persistent volume claim for MySQL data
oc apply -f k8s/mysql/manifests/mysql-pvc.yaml

# Apply network policy for MySQL security
oc apply -f k8s/mysql/manifests/mysql-greetings.networkpolicy.yaml

# Deploy MySQL and create service
oc apply -f k8s/mysql/manifests/mysql-deployment.yaml
```

2. Verify resources were created:

```bash
# Check all MySQL-related resources
oc get all,secret,pvc,networkpolicy -l app.kubernetes.io/name=mysql-greetings

# Wait for pod to be ready
oc get pods -l app.kubernetes.io/name=mysql-greetings --watch
```

#### B. Connect and Test

1. Get a shell to the MySQL pod:

```bash
# First, get the pod name
oc get pods -l app.kubernetes.io/name=mysql-greetings

# Connect to the pod (replace pod-name with actual pod name)
oc rsh mysql-greetings-xxxxx-xxxxx
```

2. Test MySQL connection using secret credentials:

```bash
# Connect to MySQL inside the pod
mysql -u greetinguser -pgreetingpass greeting_db

# Or connect directly in one command
oc rsh $(oc get pod -l app.kubernetes.io/name=mysql-greetings -o name) mysql -u greetinguser -pgreetingpass greeting_db
```

3. Verify database setup:

```bash
# List all accessible databases
mysql -u greetinguser -pgreetingpass -e "SHOW DATABASES;"

# Expected output:
# +--------------------+
# | Database           |
# +--------------------+
# | greeting_db        |
# | information_schema |
# | performance_schema |
# +--------------------+
```

#### MySQL Configuration

Default development credentials (stored in `mysql-secret.yaml`):

- Database Name: `greeting_db`
- Username: `greetinguser`
- Password: `greetingpass`
- Root Password: `rootpass`

4. Set up the database and table:

```bash
# Get MySQL pod name
POD_NAME=$(oc get pod -l app.kubernetes.io/name=mysql-greetings -o name)

# Create database and table
oc exec -it $POD_NAME -- mysql -u root -prootpass -e "
CREATE DATABASE IF NOT EXISTS greeting_db;
USE greeting_db;
CREATE TABLE IF NOT EXISTS greetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    greeting TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"

# Grant permissions to application user
oc exec -it $POD_NAME -- mysql -u root -prootpass -e "
GRANT ALL PRIVILEGES ON greeting_db.* TO 'greetinguser'@'%';
FLUSH PRIVILEGES;"

# Verify table creation
oc exec -it $POD_NAME -- mysql -u greetinguser -pgreetingpass -e "USE greeting_db; SHOW TABLES;"
```

**Note:** For production deployment, ensure to:

1. Change these default credentials
2. Use a secure method for managing secrets (e.g., HashiCorp Vault)
3. Consider using higher resource limits

### 3. Deploy Backend API

#### A. Node.js Backend Deployment

```bash
# Build backend
docker build -f Dockerfile.backend -t backend:latest .
docker tag backend:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend:latest
```

#### B. .NET Backend Deployment

1. Build and Push Image:

```bash
# Navigate to .NET backend directory
cd backendDotNetEntity

# Build .NET backend (ensure targeting linux/amd64)
docker buildx build --platform linux/amd64 -t greeting-backend-dotnet:latest .
docker tag greeting-backend-dotnet:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend-dotnet:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend-dotnet:latest
```

2. Deploy Resources:

```bash
# Apply .NET backend configurations
oc apply -f k8s/backendDotNetEntity/manifests/

# Verify deployment
oc get pods,svc -l app=greeting-backend-dotnet
```

3. Environment Variables:

The .NET backend service uses the following environment variables:

- `ConnectionStrings__DefaultConnection`: MySQL connection string
- `ASPNETCORE_URLS`: Backend service URLs (default: http://\*:3010)

4. API Endpoints:

The .NET backend service exposes the following REST endpoints:

- **Health Check**

  - Method: `GET`
  - Path: `/health`
  - Response: `200 OK`

- **Create Greeting**

  - Method: `POST`
  - Path: `/api/greetings`
  - Content-Type: `application/json`
  - Request Body:
    ```json
    {
      "name": "string",
      "greeting": "string"
    }
    ```
  - Response: `201 Created`

- **Get All Greetings**
  - Method: `GET`
  - Path: `/api/greetings`
  - Response: `200 OK`

#### C. MySQL Backup and Recovery

1. Create database backup:

```bash
# Get MySQL pod name
POD_NAME=$(oc get pod -l app.kubernetes.io/name=mysql-greetings -o name)

# Create backup
oc exec $POD_NAME -- mysqldump -u root -prootpass greeting_db > backup.sql

# Or backup to compressed file
oc exec $POD_NAME -- mysqldump -u root -prootpass greeting_db | gzip > backup.sql.gz
```

2. Restore from backup:

```bash
# Restore from SQL file
oc exec -i $POD_NAME -- mysql -u root -prootpass greeting_db < backup.sql

# Or restore from compressed file
zcat backup.sql.gz | oc exec -i $POD_NAME -- mysql -u root -prootpass greeting_db
```

#### Frontend Browser Compatibility

The frontend application is compatible with:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

Minimum required screen resolution: 1024x768

#### Monitoring and Logging

1. **OpenShift Monitoring**

   - Resource usage metrics available in OpenShift dashboard
   - CPU, memory, and network usage tracked
   - Pod health status monitoring

2. **Application Logging**

   - Backend logs available via `oc logs deployment/greeting-backend`
   - Frontend logs available via `oc logs deployment/frontend`
   - MySQL logs available via `oc logs deployment/mysql-greetings`

3. **Database Monitoring**
   - Connection pool status
   - Query performance metrics
   - Storage usage tracking

### 4. Deploy Frontend

#### A. Build and Push Image

```bash
# Build frontend
docker build -f Dockerfile.frontend -t frontend:latest .
docker tag frontend:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-frontend:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-frontend:latest
```

#### B. Deploy Resources

```bash
# Apply frontend configurations
oc apply -f k8s/frontend/manifests/

# Verify deployment
oc get pods,svc,route -l app.kubernetes.io/name=frontend
```

#### C. Environment Variables

The frontend service uses the following environment variables:

- `REACT_APP_API_URL`: Backend API URL (default: https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca)
- `PORT`: Frontend service port (default: 8080)
- `NODE_ENV`: Node environment (default: production)

#### D. Application Features

The frontend application provides the following features:

1. **Create Greeting**

   - Form to input name and greeting message
   - Submit button to save the greeting
   - Success/error feedback on submission

2. **View Greetings**
   - List of all greetings in reverse chronological order
   - Each greeting shows:
     - Name of the person
     - Greeting message
     - Creation timestamp
   - Auto-refresh when new greetings are added

#### E. Test Frontend Connection

1. Access the frontend application:

```bash
# Get the frontend route
FRONTEND_URL=$(oc get route frontend -o jsonpath='{.spec.host}')
echo "Frontend URL: https://$FRONTEND_URL"
```

2. Verify the application:
   - Open the URL in a web browser
   - Create a new greeting using the form
   - Verify the greeting appears in the list
   - Check that previously created greetings are visible

### 5. Verify Deployment

```bash
# Check all resources
oc get all

# Check pods status
oc get pods

# Check routes
oc get routes

# Check services
oc get svc
```

### 6. Troubleshooting

```bash
# Check pod logs
oc logs <pod-name>

# Check pod description
oc describe pod <pod-name>

# Check deployment status
oc rollout status deployment/<deployment-name>

# Restart deployments if needed
oc rollout restart deployment/<deployment-name>
```

### Testing Backend Connectivity

When the backend route is not exposed or you need to verify internal service communication, you can test the backend service directly from the frontend pod:

```bash
# Get the frontend pod name
FRONTEND_POD=$(oc get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}')

# Test the backend service using curl from the frontend pod
oc exec -it $FRONTEND_POD -- curl -v http://greeting-backend.5b7aa5-dev.svc.cluster.local:3001/api/greetings

# Expected successful response will return a JSON array of greetings
```

This test helps verify:

- DNS resolution of the backend service
- Network connectivity between frontend and backend
- Backend service functionality
- Proper configuration of the service endpoint

If this test succeeds but the frontend application cannot connect, check the Nginx configuration in the frontend ConfigMap.

## Troubleshooting Guide

### Frontend Nginx Proxy Issues

If you encounter issues with the frontend pod unable to connect to the backend service, particularly with DNS resolution errors like "host not found in upstream", follow these troubleshooting steps:

1. Check Pod Status and Logs:

```bash
# Get frontend pod status
oc get pods | grep frontend

# Check pod logs for specific errors
oc logs <frontend-pod-name>
```

2. DNS Resolution Issues:

   - If you see errors like "host not found in upstream 'greeting-backend'", this indicates DNS resolution problems
   - Try these solutions in order:

   a. Use Full DNS Name:

   ```nginx
   location /api/ {
       resolver 10.96.0.10 valid=10s;
       proxy_pass http://greeting-backend.5b7aa5-dev.svc.cluster.local:3001;
   }
   ```

   b. Use Service ClusterIP (temporary solution):

   ```nginx
   location /api/ {
       proxy_pass http://<service-cluster-ip>:3001;
   }
   ```

3. Test Backend Connectivity:

   - Test the connection from within the frontend pod:

   ```bash
   # Test API endpoint through Nginx
   oc exec <frontend-pod-name> -- curl -v http://localhost:8080/api/greetings

   # Get backend service details
   oc get svc greeting-backend
   ```

4. Common Solutions:
   - Verify the backend service exists and has endpoints
   - Check network policies allow communication between frontend and backend
   - Ensure the backend service port matches the proxy_pass port
   - Verify the backend service is in the same namespace

Remember: Using ClusterIP directly in the Nginx configuration is not recommended for production as it bypasses Kubernetes service discovery, but it can be useful for temporary troubleshooting.

### .NET Backend Issues

1. Port Configuration:

   - Ensure `ASPNETCORE_URLS` is set correctly in the deployment
   - Default port should be 3010
   - Check for port conflicts with other services

2. Database Connection:

   - Verify connection string format in secret
   - Check network policy allows connection to MySQL
   - Ensure Entity Framework migrations are applied

3. Common Issues:

```bash
# Check .NET backend logs
oc logs deployment/greeting-backend-dotnet

# Check environment variables
oc set env deployment/greeting-backend-dotnet --list

# Verify network policy
oc get networkpolicy greeting-backend-dotnet-network-policy -o yaml

# Test database connection from pod
oc exec deployment/greeting-backend-dotnet -- curl -v http://mysql-greetings:3306
```

4. Architecture Issues:
   - Ensure Docker builds target linux/amd64 platform
   - Use buildx for cross-platform builds
   - Verify base image compatibility

### Network Policy Configuration

1. Frontend to Backend Communication:

   - Frontend must have egress rules to both backends
   - Backend services must have ingress rules from frontend
   - Verify port numbers (3001 for Node.js, 3010 for .NET)

2. Backend to Database Communication:
   - Both backends need egress rules to MySQL (port 3306)
   - MySQL needs ingress rules from both backends

Example network policy verification:

```bash
# Check frontend network policy
oc get networkpolicy frontend-network-policy -o yaml

# Check Node.js backend network policy
oc get networkpolicy greeting-backend-allow-same-namespace -o yaml

# Check .NET backend network policy
oc get networkpolicy greeting-backend-dotnet-network-policy -o yaml

# Check MySQL network policy
oc get networkpolicy mysql-greetings-network-policy -o yaml
```

### Date Format Handling

1. Frontend Considerations:

   - Handles both Node.js and .NET date formats
   - Uses ISO 8601 format for consistency
   - Implements proper date parsing and display

2. Backend Date Formats:
   - Node.js: Native JavaScript Date objects
   - .NET: ISO 8601 format with Entity Framework
   - MySQL: TIMESTAMP data type

## Environment Variables

### Frontend

- `REACT_APP_API_URL`: Backend API URL
- `PORT`: Frontend service port (default: 3000)

## Security Considerations

1. All sensitive information is stored in Kubernetes secrets
2. Network policies are in place to restrict pod communication
3. Persistent volumes are used for database storage
4. HTTPS is enabled for external access

## Maintenance

### Updating Dependencies

1. Regularly update npm packages in both frontend and backend
2. Keep Docker base images updated
3. Monitor OpenShift operator versions

### Backup

1. Database backups should be scheduled regularly
2. Configuration files should be version controlled
3. Container images should be tagged and stored in a registry

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here]

### Nginx Configuration and Testing

The frontend uses Nginx as a reverse proxy to handle API requests and serve static files. The configuration is managed through a ConfigMap in `k8s/frontend/manifests/nginx-config.yaml`.

#### Key Configuration Areas

1. **Static File Serving**:

```nginx
location / {
    try_files $uri /index.html;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

2. **API Proxy Configuration**:

```nginx
location /api/ {
    rewrite ^/api/(.*) /api/$1 break;
    proxy_pass http://greeting-backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

3. **CORS Headers**:

```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
```

#### Testing Nginx Configuration

1. **Verify Configuration Syntax**:

```bash
# Get frontend pod name
FRONTEND_POD=$(oc get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}')

# Check Nginx configuration
oc exec $FRONTEND_POD -- nginx -t
```

2. **Test Static File Serving**:

```bash
# Test index.html
oc exec $FRONTEND_POD -- curl -I http://localhost:8080/

# Test static asset (replace with actual asset path)
oc exec $FRONTEND_POD -- curl -I http://localhost:8080/static/js/main.js
```

3. **Test API Proxying**:

```bash
# Test API endpoint through Nginx
oc exec $FRONTEND_POD -- curl -v http://localhost:8080/api/greetings

# Test API endpoint directly (bypass Nginx)
oc exec $FRONTEND_POD -- curl -v http://greeting-backend:3001/api/greetings
```

4. **Test CORS Headers**:

```bash
# Test OPTIONS request (CORS preflight)
oc exec $FRONTEND_POD -- curl -X OPTIONS -I http://localhost:8080/api/greetings \
  -H 'Origin: http://example.com' \
  -H 'Access-Control-Request-Method: POST'
```

#### Common Nginx Issues and Solutions

1. **502 Bad Gateway**:

   - Check if backend service is running: `oc get pods -l app=greeting-backend`
   - Verify service DNS resolution: `oc exec $FRONTEND_POD -- nslookup greeting-backend`
   - Check backend service port matches proxy_pass

2. **504 Gateway Timeout**:

   - Increase proxy timeout settings:

   ```nginx
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

3. **DNS Resolution Issues**:

   - Use full service DNS name: `greeting-backend.5b7aa5-dev.svc.cluster.local`
   - Add resolver directive: `resolver kube-dns.kube-system.svc.cluster.local valid=10s;`
   - Temporarily use ClusterIP (not recommended for production)

4. **CORS Issues**:
   - Verify CORS headers in response: `curl -v -H "Origin: http://example.com" http://localhost:8080/api/greetings`
   - Check if headers are added for all response codes
   - Ensure OPTIONS requests are handled correctly

#### Nginx Logging and Debugging

1. **Access Logs**:

```bash
# View access logs
oc exec $FRONTEND_POD -- tail -f /var/log/nginx/access.log
```

2. **Error Logs**:

```bash
# View error logs
oc exec $FRONTEND_POD -- tail -f /var/log/nginx/error.log
```

3. **Debug Mode**:

   - Enable debug logging in nginx.conf:

   ```nginx
   error_log /var/log/nginx/error.log debug;
   ```

4. **Request Tracing**:
   - Add request ID tracking:
   ```nginx
   add_header X-Request-ID $request_id;
   proxy_set_header X-Request-ID $request_id;
   ```

Remember to restart Nginx after configuration changes:

```bash
oc exec $FRONTEND_POD -- nginx -s reload
```

## GitHub Workflow

### Pushing Updates

1. **Update Local Repository**:

```bash
# Ensure you're on the main branch
git checkout main

# Pull latest changes
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

2. **Make and Test Changes**:

```bash
# Stage changes
git add .

# Create a descriptive commit
git commit -m "feat: description of your changes"
```

3. **Update OpenShift Configurations**:

   - If you've modified Kubernetes/OpenShift configurations:

   ```bash
   # Test configurations locally
   oc apply --dry-run=client -f k8s/frontend/manifests/
   oc apply --dry-run=client -f k8s/backend/manifests/
   ```

4. **Push Changes**:

```bash
# Push your feature branch
git push origin feature/your-feature-name
```

5. **Create Pull Request**:

   - Go to GitHub repository
   - Click "Compare & pull request"
   - Fill in PR template:

     ```markdown
     ## Description

     Brief description of changes

     ## Type of Change

     - [ ] Bug fix
     - [ ] New feature
     - [ ] Configuration update
     - [ ] Documentation update

     ## Testing

     - [ ] Unit tests updated
     - [ ] Integration tests updated
     - [ ] Manual testing performed

     ## OpenShift Impact

     - [ ] Deployment changes
     - [ ] Configuration changes
     - [ ] Resource requirements changes
     ```

### Version Control Best Practices

1. **Commit Messages**:

   - Use conventional commits format:
     ```
     feat: add new feature
     fix: resolve bug
     docs: update documentation
     chore: update dependencies
     refactor: code improvements
     test: add or modify tests
     ```

2. **Branch Strategy**:

   - `main`: Production-ready code
   - `feature/*`: New features
   - `fix/*`: Bug fixes
   - `docs/*`: Documentation updates
   - `release/*`: Release preparation

3. **Code Review Guidelines**:

   - Review OpenShift configurations carefully
   - Check for sensitive information
   - Verify environment variables
   - Ensure documentation is updated
   - Test deployment steps

4. **Post-Merge Actions**:

```bash
# Switch back to main
git checkout main

# Pull merged changes
git pull origin main

# Delete local feature branch
git branch -d feature/your-feature-name

# Delete remote feature branch (optional)
git push origin --delete feature/your-feature-name
```

### Deployment After Push

1. **Build and Push Images**:

```bash
# Build and push frontend
docker build -f Dockerfile.frontend -t frontend:latest .
docker tag frontend:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-frontend:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-frontend:latest

# Build and push backend
docker build -f Dockerfile.backend -t backend:latest .
docker tag backend:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend:latest
```

2. **Apply Configuration Changes**:

```bash
# Apply backend changes
oc apply -f k8s/backend/manifests/

# Apply frontend changes
oc apply -f k8s/frontend/manifests/

# Restart deployments if needed
oc rollout restart deployment/frontend
oc rollout restart deployment/greeting-backend
```

3. **Verify Deployment**:

```bash
# Check pod status
oc get pods

# Check logs for errors
oc logs deployment/frontend
oc logs deployment/greeting-backend

# Test the application
curl -v https://$(oc get route frontend -o jsonpath='{.spec.host}')/api/greetings
```

### 3a. Deploy .NET Entity API Backend (Alternative)

#### A. Build and Push Image

```bash
# Build .NET backend
docker buildx build --platform linux/amd64 -f Dockerfile.backendDotNetEntity -t backend-dotnet:latest .
docker tag backend-dotnet:latest image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend-dotnet:latest
docker push image-registry.apps.silver.devops.gov.bc.ca/5b7aa5-dev/greeting-backend-dotnet:latest
```

#### B. Deploy Resources

```bash
# Apply .NET backend configurations
oc apply -f k8s/backendDotNetEntity/manifests/

# Verify deployment
oc get pods,svc,route -l app=greeting-backend-dotnet
```

#### C. Environment Variables

The .NET backend service uses the following environment variables from the `mysql-greetings-secret`:

- `DB_HOSTNAME`: MySQL host (from mysql-greetings-secret)
- `DB_USER`: Database user (from mysql-greetings-secret)
- `DB_PASSWORD`: Database password (from mysql-greetings-secret)
- `DB_NAME`: Database name (from mysql-greetings-secret)
- `ASPNETCORE_URLS`: Backend service URL (default: http://+:3010)

#### D. API Endpoints

The .NET backend service exposes the following REST endpoints:

1. **Create Greeting**

   - Method: `POST`
   - Path: `/api/greetings`
   - Content-Type: `application/json`
   - Request Body:
     ```json
     {
       "name": "string",
       "greeting": "string"
     }
     ```
   - Response: `201 Created`
     ```json
     {
       "id": "number",
       "name": "string",
       "greeting": "string",
       "created_at": "timestamp"
     }
     ```

2. **Get All Greetings**
   - Method: `GET`
   - Path: `/api/greetings`
   - Response: `200 OK`
     ```json
     [
       {
         "id": "number",
         "name": "string",
         "greeting": "string",
         "created_at": "timestamp"
       }
     ]
     ```

#### E. Testing and Verification

1. Check deployment status:

```bash
# Get pod status
oc get pods -l app=greeting-backend-dotnet

# Check logs
oc logs -l app=greeting-backend-dotnet
```

2. Test API endpoints:

```bash
# Get the route URL
BACKEND_URL=$(oc get route greeting-backend-dotnet -o jsonpath='{.spec.host}')

# Test GET endpoint
curl -v https://$BACKEND_URL/api/greetings

# Test POST endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test User","greeting":"Hello from .NET!"}' \
  https://$BACKEND_URL/api/greetings
```

#### F. Troubleshooting

1. Database Connection Issues:

```bash
# Check secret values
oc describe secret mysql-greetings-secret

# Verify MySQL service
oc get service mysql-greetings

# Test MySQL connection from pod
oc exec -it $(oc get pod -l app=greeting-backend-dotnet -o jsonpath='{.items[0].metadata.name}') -- curl mysql-greetings:3306
```

2. Pod Issues:

```bash
# Check pod events
oc describe pod -l app=greeting-backend-dotnet

# Check detailed logs
oc logs -l app=greeting-backend-dotnet --previous

# Restart deployment if needed
oc rollout restart deployment/greeting-backend-dotnet
```

3. Common Solutions:
   - Verify all secret values are correct
   - Check network policies allow communication
   - Ensure MySQL service is running
   - Verify the database exists and is accessible

### DNS Resolution and Service IP Issues

1. **Identifying DNS Issues**:

```bash
# Check if DNS resolution is working
oc exec frontend-pod -- nslookup greeting-backend
oc exec frontend-pod -- nslookup greeting-backend-dotnet
oc exec frontend-pod -- nslookup mysql-greetings

# If DNS fails, get service IPs
oc get svc -o custom-columns=NAME:.metadata.name,IP:.spec.clusterIP,PORT:.spec.ports[*].port
```

2. **Updating Service References**:

a. Get current service IPs:

```bash
# Store service IPs in variables
NODE_BACKEND_IP=$(oc get svc greeting-backend -o jsonpath='{.spec.clusterIP}')
DOTNET_BACKEND_IP=$(oc get svc greeting-backend-dotnet -o jsonpath='{.spec.clusterIP}')
MYSQL_IP=$(oc get svc mysql-greetings -o jsonpath='{.spec.clusterIP}')

# Display all IPs
echo "Node.js Backend IP: $NODE_BACKEND_IP"
echo ".NET Backend IP: $DOTNET_BACKEND_IP"
echo "MySQL IP: $MYSQL_IP"
```

b. Update ConfigMap for Nginx:

```bash
# Create new ConfigMap with updated IPs
cat <<EOF | oc apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    location /api/ {
        proxy_pass http://${NODE_BACKEND_IP}:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    location /api-dotnet/ {
        proxy_pass http://${DOTNET_BACKEND_IP}:3010;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
EOF
```

3. **Testing Service Connectivity**:

```bash
# Test Node.js backend connectivity
oc exec frontend-pod -- curl -v http://${NODE_BACKEND_IP}:3001/api/greetings

# Test .NET backend connectivity
oc exec frontend-pod -- curl -v http://${DOTNET_BACKEND_IP}:3010/api/greetings

# Test MySQL connectivity
oc exec backend-pod -- nc -zv ${MYSQL_IP} 3306
```

4. **Updating Backend Configurations**:

a. Update Node.js backend secret:

```bash
oc patch secret backend-config -p "{\"data\":{\"DB_HOST\": \"$(echo -n ${MYSQL_IP} | base64)\"}}"
```

b. Update .NET backend secret:

```bash
# Create connection string with MySQL IP
CONNECTION_STRING="Server=${MYSQL_IP};Port=3306;Database=greeting_db;User=greetinguser;Password=greetingpass"
oc patch secret dotnet-backend-config -p "{\"data\":{\"ConnectionStrings__DefaultConnection\": \"$(echo -n ${CONNECTION_STRING} | base64)\"}}"
```

5. **Verifying Updates**:

```bash
# Restart pods to pick up new configurations
oc rollout restart deployment/frontend
oc rollout restart deployment/greeting-backend
oc rollout restart deployment/greeting-backend-dotnet

# Watch pod status
oc get pods -w

# Check logs for connection issues
oc logs -f deployment/frontend
oc logs -f deployment/greeting-backend
oc logs -f deployment/greeting-backend-dotnet
```

6. **Maintenance Notes**:

- Service IPs may change when:
  - Services are recreated
  - The cluster is restarted
  - Network policies are updated
- Always verify service IPs after cluster maintenance
- Consider creating a maintenance script to update configurations
- Document current service IPs in team documentation
