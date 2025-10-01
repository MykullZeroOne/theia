// *****************************************************************************
// Copyright (C) 2024 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import * as express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { Container } from '@theia/core/shared/inversify';
import * as swaggerUi from 'swagger-ui-express';
import * as YAML from 'yamljs';
import { join } from 'path';
import { MobileBackendModule } from './mobile-backend-module';
import { MobileConnectionHandler, Channel, Disposable } from './mobile-connection-handler';

/**
 * WebSocket to Channel adapter.
 * Converts ws.WebSocket to Theia's Channel interface.
 */
class WebSocketChannel implements Channel {
    constructor(private ws: any) {}

    onMessage(handler: (data: Uint8Array) => void): Disposable {
        const listener = (data: Buffer) => {
            handler(new Uint8Array(data));
        };
        this.ws.on('message', listener);
        return {
            dispose: () => {
                this.ws.off('message', listener);
            }
        };
    }

    onClose(handler: () => void): Disposable {
        this.ws.on('close', handler);
        return {
            dispose: () => {
                this.ws.off('close', handler);
            }
        };
    }

    onError(handler: (reason: any) => void): Disposable {
        this.ws.on('error', handler);
        return {
            dispose: () => {
                this.ws.off('error', handler);
            }
        };
    }

    send(data: Uint8Array): void {
        this.ws.send(Buffer.from(data));
    }

    close(): void {
        this.ws.close();
    }
}

/**
 * Main entry point for Theia Mobile Backend.
 *
 * Starts an HTTP server with WebSocket support for mobile clients.
 */
async function bootstrap(): Promise<void> {
    // Create Express app
    const app = express();
    const server = createServer(app);

    // Parse JSON
    app.use(express.json());

    // Swagger UI setup
    try {
        const openapiPath = join(__dirname, '../../openapi.yaml');
        const swaggerDocument = YAML.load(openapiPath);

        const swaggerOptions = {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Theia Mobile Backend API Documentation'
        };

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
        console.log('[Mobile Backend] API documentation available at /api-docs');
    } catch (error) {
        console.warn('[Mobile Backend] Failed to load OpenAPI documentation:', error);
    }

    // Root redirect to API docs
    app.get('/', (req: express.Request, res: express.Response) => {
        res.redirect('/api-docs');
    });

    // Health check endpoint
    app.get('/health', (req: express.Request, res: express.Response) => {
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    // Setup Dependency Injection Container
    const container = new Container();
    container.load(MobileBackendModule);

    // Get services
    const connectionHandler = container.get(MobileConnectionHandler);

    // Create WebSocket server
    const wsPath = process.env.MOBILE_WS_PATH || '/mobile';
    const wss = new WebSocketServer({
        server,
        path: wsPath
    });

    console.log(`[Mobile Backend] WebSocket server configured on path: ${wsPath}`);

    // Handle WebSocket connections
    wss.on('connection', (ws: any, request: any) => {
        const clientIp = request.socket.remoteAddress || 'unknown';
        console.log(`[Mobile Backend] New connection from ${clientIp}`);

        // Convert WebSocket to Channel
        const channel = new WebSocketChannel(ws);

        // Handle connection via connection handler
        connectionHandler.handleConnection(channel).catch((error: Error) => {
            console.error(`[Mobile Backend] Connection handler error:`, error);
            ws.close();
        });

        ws.on('close', () => {
            console.log(`[Mobile Backend] Connection closed from ${clientIp}`);
        });

        ws.on('error', (error: Error) => {
            console.error(`[Mobile Backend] WebSocket error from ${clientIp}:`, error);
        });
    });

    // Error handling
    wss.on('error', (error: Error) => {
        console.error('[Mobile Backend] WebSocket server error:', error);
    });

    // Start server
    const PORT = parseInt(process.env.MOBILE_BACKEND_PORT || '3030', 10);
    const HOST = process.env.MOBILE_BACKEND_HOST || '0.0.0.0';

    server.listen(PORT, HOST, () => {
        console.log(`[Mobile Backend] Server started`);
        console.log(`[Mobile Backend] API Docs: http://${HOST}:${PORT}/api-docs`);
        console.log(`[Mobile Backend] Health check: http://${HOST}:${PORT}/health`);
        console.log(`[Mobile Backend] WebSocket: ws://${HOST}:${PORT}${wsPath}`);
    });

    // Graceful shutdown
    const shutdown = async (): Promise<void> => {
        console.log('[Mobile Backend] Shutting down...');

        wss.close(() => {
            console.log('[Mobile Backend] WebSocket server closed');
        });

        server.close(() => {
            console.log('[Mobile Backend] HTTP server closed');
            process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
            console.error('[Mobile Backend] Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

// Start the server
bootstrap().catch((error: Error) => {
    console.error('[Mobile Backend] Failed to start:', error);
    process.exit(1);
});
