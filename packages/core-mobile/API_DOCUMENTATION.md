# Theia Mobile Backend - API Documentation

Complete API documentation for the Theia Mobile Backend, including REST endpoints, WebSocket RPC methods, and testing tools.

## Overview

The Theia Mobile Backend provides:
- **HTTP REST API** - Health checks and monitoring
- **WebSocket RPC API** - Real-time bidirectional communication
- **OpenAPI 3.0 Specification** - Machine-readable API definition
- **Swagger UI** - Interactive API documentation
- **Postman Collections** - Ready-to-use API testing

## Quick Links

### Running Backend
```bash
cd packages/core-mobile
npm run start:backend
```

### Access Documentation
- **Swagger UI**: http://localhost:3030/api-docs
- **Health Check**: http://localhost:3030/health
- **WebSocket**: ws://localhost:3030/mobile

## Documentation Files

### 1. OpenAPI Specification

**File**: `openapi.yaml`

Complete OpenAPI 3.0 specification with:
- All HTTP endpoints
- Complete schema definitions
- WebSocket RPC methods documented in `x-rpc-methods`
- Request/response examples
- Error codes and descriptions

**Usage**:
```bash
# View in Swagger UI
npm run start:backend
# Then open http://localhost:3030/api-docs

# Validate specification
npx @apidevtools/swagger-cli validate openapi.yaml

# Generate client code
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated-client
```

### 2. Postman Collections

**Location**: `postman/` directory

#### HTTP Endpoints Collection
**File**: `Theia-Mobile-Backend-HTTP.postman_collection.json`

Contains:
- Health check endpoint
- Pre-request scripts
- Response validation tests
- Example responses

**Features**:
- ✅ Automated tests for status codes
- ✅ JSON response validation
- ✅ Type checking for response fields
- ✅ Success and error examples

#### WebSocket RPC Collection
**File**: `Theia-Mobile-Backend-WebSocket.postman_collection.json`

Contains all WebSocket RPC methods:
- **Initialization**: `mobile/initialize`, `mobile/requestCapabilities`
- **Session Management**: `mobile/createSession`, `mobile/restoreSession`, `mobile/updateSessionState`
- **LSP Operations**: Text document sync, completions, hover, definition
- **Language Profiles**: List, switch, get active profile

**Features**:
- ✅ Organized by functional area
- ✅ Request/response examples
- ✅ Variable substitution with {{placeholders}}
- ✅ Pre-request scripts for UUID generation

#### Environment File
**File**: `Theia-Mobile-Backend.postman_environment.json`

Pre-configured environment with:
- `baseUrl`: http://localhost:3030
- `wsUrl`: ws://localhost:3030
- `host`: localhost
- `port`: 3030
- Variables for `clientId`, `sessionId`, `workspaceUri`

### 3. Swagger UI Integration

**Endpoint**: http://localhost:3030/api-docs

Interactive API documentation with:
- ✅ Browse all endpoints
- ✅ View request/response schemas
- ✅ Interactive "Try it out" feature
- ✅ Code generation snippets
- ✅ Markdown descriptions
- ✅ Custom branding (Theia Mobile Backend)

**Features**:
- Root path (/) redirects to /api-docs
- Custom CSS removes Swagger topbar
- Custom site title
- Served directly from `openapi.yaml`

## Using the Documentation

### Method 1: Swagger UI (Interactive)

1. **Start backend**:
   ```bash
   npm run start:backend
   ```

2. **Open browser**:
   ```
   http://localhost:3030/api-docs
   ```

3. **Explore API**:
   - Click on endpoints to expand
   - Click "Try it out" to test
   - View request/response schemas
   - See example responses

### Method 2: Postman (Testing)

#### Import Collections

1. **Open Postman**
2. **Import files**:
   - Click "Import"
   - Select all 3 files from `postman/` directory:
     - `Theia-Mobile-Backend-HTTP.postman_collection.json`
     - `Theia-Mobile-Backend-WebSocket.postman_collection.json`
     - `Theia-Mobile-Backend.postman_environment.json`

3. **Select environment**:
   - Click environment dropdown (top right)
   - Select "Theia Mobile Backend - Local Development"

#### Test HTTP Endpoints

1. **Open HTTP collection**
2. **Expand "Health & Monitoring"**
3. **Select "Health Check"**
4. **Click "Send"**
5. **View response** and automated test results

#### Test WebSocket RPC

**Note**: Requires Postman v10.19+ with WebSocket support

1. **Open WebSocket collection**
2. **Expand "Initialization"**
3. **Select "Initialize Session"**
4. **Connect to WebSocket**:
   - Click "Connect" button
   - URL: `ws://localhost:3030/mobile`
5. **Send request**:
   - Message body is pre-filled
   - Click "Send"
6. **View response** from server

### Method 3: Command Line (curl/wscat)

#### HTTP Endpoints

```bash
# Health check
curl http://localhost:3030/health

# With pretty printing
curl -s http://localhost:3030/health | jq .
```

#### WebSocket

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3030/mobile

# Send initialize request (paste this after connecting)
{"id":"1","method":"mobile/initialize","params":[{"clientInfo":{"name":"Test","version":"1.0.0"},"capabilities":{}}]}

# Send completion request
{"id":"2","method":"mobile/completion","params":[{"textDocument":{"uri":"file:///test.java"},"position":{"line":1,"character":10}}]}
```

### Method 4: Generate Client SDKs

#### TypeScript Client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client

# Use generated client
import { HealthApi } from './generated/typescript-client';

const api = new HealthApi({ basePath: 'http://localhost:3030' });
const health = await api.getHealth();
```

#### Python Client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client

# Use generated client
from generated.python_client import ApiClient, HealthApi

api = HealthApi(ApiClient(host='http://localhost:3030'))
health = api.get_health()
```

#### Java Client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g java \
  -o ./generated/java-client
```

#### Swift Client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g swift5 \
  -o ./generated/swift-client
```

## API Reference

### HTTP Endpoints

#### GET /health

**Description**: Health check endpoint

**Response**: 200 OK
```json
{
  "status": "ok",
  "uptime": 3600.123,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### GET /api-docs

**Description**: Swagger UI documentation interface

**Response**: 200 OK (HTML)

#### GET /

**Description**: Root path, redirects to /api-docs

**Response**: 302 Redirect

### WebSocket RPC Methods

See complete list in `openapi.yaml` under `x-rpc-methods`.

**Categories**:
1. **Initialization** - Session setup and capability exchange
2. **Session Management** - Create, restore, update sessions
3. **LSP Operations** - Text sync, completions, hover, diagnostics
4. **Language Profiles** - Profile management (protocol ready)

**Message Format**:
```typescript
// Request
{
  "id": "uuid",
  "method": "mobile/methodName",
  "params": [...]
}

// Response
{
  "id": "uuid",
  "result": {...}
}

// Notification
{
  "method": "mobile/notificationName",
  "params": [...]
}
```

## Common Workflows

### Workflow 1: Initialize and Create Session

1. Connect to WebSocket: `ws://localhost:3030/mobile`
2. Send `mobile/initialize` request
3. Receive server capabilities
4. Send `mobile/createSession` request
5. Receive session ID
6. Begin LSP operations

**Postman**:
```
1. WebSocket collection → Initialization → Initialize Session → Send
2. WebSocket collection → Session Management → Create Session → Send
```

### Workflow 2: Edit Document with Completions

1. Send `mobile/didOpenTextDocument` notification
2. Edit text
3. Send `mobile/didChangeTextDocument` notification
4. Request `mobile/completion` at cursor position
5. Receive completion items
6. Send `mobile/didCloseTextDocument` when done

### Workflow 3: Switch Language Profile

1. Send `mobile/listProfiles` request
2. Choose profile
3. Send `mobile/switchProfile` request
4. Receive progress notifications from server
5. Profile switch complete

## Testing Tips

### Using Postman Variables

Collections use variables for flexibility:

```javascript
// In requests
{{$guid}}        // Generate UUID
{{baseUrl}}      // http://localhost:3030
{{host}}         // localhost
{{port}}         // 3030
{{clientId}}     // Your client ID
{{sessionId}}    // Current session ID
```

**Set variables**:
1. Click environment (top right)
2. Edit "Theia Mobile Backend - Local Development"
3. Set variable values

### Automated Testing

Postman includes test scripts:

```javascript
// Example test from HTTP collection
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has status field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData.status).to.equal('ok');
});
```

**Run tests**:
1. Select collection
2. Click "Run" button (top right)
3. Configure runner
4. Click "Run Theia Mobile Backend"

### Environment Variables

**Production environment**:
1. Duplicate "Local Development" environment
2. Rename to "Production"
3. Change variables:
   - `baseUrl`: https://api.modusfabrica.io
   - `wsUrl`: wss://api.modusfabrica.io
   - `host`: api.modusfabrica.io
   - `port`: 443

## Updating Documentation

### When Adding New Endpoints

1. **Update `openapi.yaml`**:
   - Add path under `paths:`
   - Define request/response schemas under `components/schemas/`
   - Add examples

2. **Update Postman collection**:
   - Add new request to appropriate folder
   - Include description
   - Add example response
   - Add tests if HTTP endpoint

3. **Rebuild and test**:
   ```bash
   npm run compile
   npm run start:backend
   # Test new endpoint in Swagger UI
   ```

### When Adding WebSocket Methods

1. **Update `openapi.yaml`**:
   - Add method under `x-rpc-methods:`
   - Define schemas
   - Add example

2. **Update WebSocket Postman collection**:
   - Add new request
   - Include variables
   - Add description

### Validation

```bash
# Validate OpenAPI spec
npx @apidevtools/swagger-cli validate openapi.yaml

# Lint OpenAPI spec
npx @stoplight/spectral-cli lint openapi.yaml
```

## Troubleshooting

### Swagger UI Not Loading

**Issue**: /api-docs returns 404 or error

**Solution**:
1. Check `openapi.yaml` exists in package root
2. Verify path: `packages/core-mobile/openapi.yaml`
3. Check console for errors
4. Ensure `swagger-ui-express` and `yamljs` installed

### WebSocket Tests Failing

**Issue**: Postman can't connect to WebSocket

**Solution**:
1. Ensure backend is running: `npm run start:backend`
2. Verify WebSocket URL: `ws://localhost:3030/mobile`
3. Check firewall/antivirus not blocking port 3030
4. Update Postman to v10.19+ (WebSocket support)

### Postman Collection Import Error

**Issue**: JSON parsing error when importing

**Solution**:
1. Verify JSON is valid: `npx jsonlint postman/*.json`
2. Re-export from this documentation
3. Check file encoding (should be UTF-8)

## Resources

- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.3
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **Postman Documentation**: https://learning.postman.com/
- **Language Server Protocol**: https://microsoft.github.io/language-server-protocol/
- **Theia Documentation**: https://theia-ide.org/docs/

## Contributing

When contributing API changes:

1. Update `openapi.yaml` first
2. Update Postman collections
3. Test in Swagger UI
4. Test in Postman
5. Update this documentation
6. Commit all changes together

---

**API Version**: 1.0.0

**Last Updated**: January 2025

**Contact**: Theia Mobile Backend Team
