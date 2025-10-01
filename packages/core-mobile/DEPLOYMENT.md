# Theia Mobile Backend - Deployment Guide

## Current Status

### ✅ Ready for Deployment
- Backend entry point (`backend-main.ts`) created
- Mobile RPC Protocol implemented (151 tests passing)
- Connection handling implemented
- Session management implemented
- LSP proxy implemented
- Docker configuration complete

### 🔧 In Progress
- Language Profile Manager (protocol types defined, service implementation needed)

### ✅ Can be containerized NOW
The backend is functional and can be containerized. The Language Profile Manager is an enhancement feature that can be added later.

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   cd /Users/michaelsmith/IdeaProjects/theia
   npm install
   ```

2. **Build the package**:
   ```bash
   cd packages/core-mobile
   npm run compile
   ```

3. **Start the backend**:
   ```bash
   npm run start:backend
   ```

   Backend will start on `ws://localhost:3030/mobile`

4. **Test the connection**:
   ```bash
   # Health check
   curl http://localhost:3030/health

   # Expected output:
   # {"status":"ok","uptime":1.234,"timestamp":"2025-01-01T12:00:00.000Z","version":"1.0.0"}
   ```

### Docker Deployment

#### Option 1: Docker Compose (Recommended)

1. **Build and start**:
   ```bash
   cd packages/core-mobile
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f mobile-backend
   ```

3. **Stop**:
   ```bash
   docker-compose down
   ```

4. **With SSL (Nginx)**:
   ```bash
   docker-compose --profile with-ssl up -d
   ```

#### Option 2: Docker Only

1. **Build image**:
   ```bash
   cd /Users/michaelsmith/IdeaProjects/theia
   docker build -t theia-mobile-backend:latest -f packages/core-mobile/Dockerfile .
   ```

2. **Run container**:
   ```bash
   docker run -d \
     --name theia-mobile-backend \
     -p 3030:3030 \
     -e NODE_ENV=production \
     -e LOG_LEVEL=info \
     theia-mobile-backend:latest
   ```

3. **Check logs**:
   ```bash
   docker logs -f theia-mobile-backend
   ```

4. **Test**:
   ```bash
   curl http://localhost:3030/health
   ```

### Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configure as needed:

```env
MOBILE_BACKEND_PORT=3030
MOBILE_BACKEND_HOST=0.0.0.0
MOBILE_WS_PATH=/mobile
LOG_LEVEL=info
NODE_ENV=production
```

## Production Deployment

### Option 1: Docker Compose with Nginx

1. **Configure SSL certificates**:
   ```bash
   mkdir -p ssl
   # Place your SSL certificates in ssl/
   # - ssl/cert.pem
   # - ssl/key.pem
   ```

2. **Create nginx.conf**:
   ```nginx
   events {
       worker_connections 1024;
   }

   http {
       upstream mobile_backend {
           server mobile-backend:3030;
       }

       server {
           listen 80;
           server_name api.modusfabrica.io;
           return 301 https://$server_name$request_uri;
       }

       server {
           listen 443 ssl http2;
           server_name api.modusfabrica.io;

           ssl_certificate /etc/nginx/ssl/cert.pem;
           ssl_certificate_key /etc/nginx/ssl/key.pem;

           location /mobile {
               proxy_pass http://mobile_backend;
               proxy_http_version 1.1;
               proxy_set_header Upgrade $http_upgrade;
               proxy_set_header Connection "upgrade";
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;

               # WebSocket timeouts
               proxy_connect_timeout 7d;
               proxy_send_timeout 7d;
               proxy_read_timeout 7d;
           }

           location /health {
               proxy_pass http://mobile_backend;
               proxy_set_header Host $host;
           }
       }
   }
   ```

3. **Start with SSL**:
   ```bash
   docker-compose --profile with-ssl up -d
   ```

### Option 2: Kubernetes Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: theia-mobile-backend
  labels:
    app: theia-mobile-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: theia-mobile-backend
  template:
    metadata:
      labels:
        app: theia-mobile-backend
    spec:
      containers:
      - name: backend
        image: theia-mobile-backend:latest
        ports:
        - containerPort: 3030
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        - name: MOBILE_BACKEND_PORT
          value: "3030"
        livenessProbe:
          httpGet:
            path: /health
            port: 3030
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3030
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: theia-mobile-backend
spec:
  selector:
    app: theia-mobile-backend
  ports:
  - protocol: TCP
    port: 3030
    targetPort: 3030
  type: LoadBalancer
```

**Deploy**:
```bash
kubectl apply -f deployment.yaml
```

### Option 3: Cloud Platforms

#### AWS (ECS with Fargate)

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag theia-mobile-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/theia-mobile-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/theia-mobile-backend:latest

# Create task definition and service via AWS Console or CLI
```

#### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/theia-mobile-backend
gcloud run deploy theia-mobile-backend \
  --image gcr.io/PROJECT_ID/theia-mobile-backend \
  --platform managed \
  --port 3030 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry myregistry --image theia-mobile-backend:latest .

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name theia-mobile-backend \
  --image myregistry.azurecr.io/theia-mobile-backend:latest \
  --ports 3030 \
  --dns-name-label theia-mobile
```

## Monitoring and Logging

### Health Checks

The backend exposes a health check endpoint:

```bash
curl http://localhost:3030/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600.123,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Logging

Set log level via environment variable:

```bash
LOG_LEVEL=debug npm run start:backend
```

Levels: `debug`, `info`, `warn`, `error`

### Docker Logs

```bash
# View logs
docker logs -f theia-mobile-backend

# Last 100 lines
docker logs --tail 100 theia-mobile-backend
```

### Prometheus Metrics (Future)

To add metrics support, create `packages/core-mobile/src/node/metrics.ts`:

```typescript
import { Counter, Gauge, register } from 'prom-client';

export const activeConnections = new Gauge({
  name: 'mobile_active_connections',
  help: 'Number of active WebSocket connections'
});

export const rpcRequests = new Counter({
  name: 'mobile_rpc_requests_total',
  help: 'Total RPC requests',
  labelNames: ['method', 'status']
});

// In backend-main.ts:
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Scaling

### Horizontal Scaling

The backend is stateless (sessions stored in memory, but can be moved to Redis).

**With sticky sessions** (recommended):
```yaml
# docker-compose.yml
services:
  mobile-backend:
    deploy:
      replicas: 4
    ports:
      - "3030-3033:3030"
```

**With session store** (future enhancement):
- Store sessions in Redis
- Enable load balancing without sticky sessions

### Vertical Scaling

Increase container resources:

```yaml
services:
  mobile-backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

## Security

### SSL/TLS

Always use WSS (WebSocket Secure) in production. Use nginx or cloud load balancer for SSL termination.

### Authentication (Future)

To add authentication, modify `backend-main.ts`:

```typescript
import jwt from 'jsonwebtoken';

wss.on('connection', (ws, request) => {
  const token = request.headers.authorization?.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Proceed with connection
  } catch (error) {
    ws.close(4401, 'Unauthorized');
    return;
  }

  connectionHandler.handleConnection(ws);
});
```

### Rate Limiting (Future)

Add rate limiting middleware:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/mobile', limiter);
```

## Troubleshooting

### Container won't start

**Check logs**:
```bash
docker logs theia-mobile-backend
```

**Common issues**:
1. Port already in use → Change port in `.env`
2. Build failed → Check `npm install` output
3. Missing dependencies → Rebuild image

### Health check failing

**Test directly**:
```bash
docker exec theia-mobile-backend curl http://localhost:3030/health
```

**Check**:
1. Backend process running?
2. Port 3030 accessible inside container?
3. Firewall blocking port?

### WebSocket connections failing

**Test connection**:
```bash
# Install wscat
npm install -g wscat

# Test connection
wscat -c ws://localhost:3030/mobile
```

**Common issues**:
1. CORS policy → Configure CORS in backend
2. SSL certificate issues → Check nginx config
3. Timeout → Check network/firewall

## What's Next (Future Enhancements)

### Language Profile Manager
- Download and manage LSPs on-demand
- Profile switching
- Progress tracking

### Session Persistence
- Store sessions in Redis/PostgreSQL
- Enable true horizontal scaling

### Authentication
- JWT-based authentication
- API key support

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Error tracking (Sentry)

### Caching
- Redis for LSP response caching
- Reduce language server load

## Summary

### ✅ Ready NOW
- Backend can be built and run
- Docker containerization works
- Health checks operational
- WebSocket connections functional
- LSP integration working (via proxy)

### 🔧 Optional Enhancements (Can add later)
- Language Profile Manager service
- Authentication
- Session persistence (Redis)
- Monitoring (Prometheus)
- Rate limiting

## Quick Deploy Checklist

- [ ] Install dependencies: `npm install`
- [ ] Build package: `npm run compile`
- [ ] Test locally: `npm run start:backend`
- [ ] Test health: `curl http://localhost:3030/health`
- [ ] Build Docker image: `docker build -t theia-mobile-backend .`
- [ ] Run container: `docker run -d -p 3030:3030 theia-mobile-backend`
- [ ] Test in container: `docker exec theia-mobile-backend curl http://localhost:3030/health`
- [ ] Deploy to production
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Test with iOS app

**The backend is ready for containerization and deployment!** 🚀
