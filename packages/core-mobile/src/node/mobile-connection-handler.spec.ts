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

import { MobileConnectionHandler } from './mobile-connection-handler';
import { MockChannel } from '../common/test/mock-channel';

describe('MobileConnectionHandler', () => {
    let handler: MobileConnectionHandler;
    let mockChannel: MockChannel;

    beforeEach(() => {
        handler = new MobileConnectionHandler();
        mockChannel = new MockChannel();
    });

    afterEach(() => {
        mockChannel.close();
    });

    describe('Connection Handling', () => {
        test('should accept new connection', async () => {
            await expect(handler.handleConnection(mockChannel)).resolves.not.toThrow();
        });

        test('should create RPC protocol for connection', async () => {
            await handler.handleConnection(mockChannel);
            expect(handler.getActiveConnections()).toHaveLength(1);
        });

        test('should cleanup on connection close', async () => {
            await handler.handleConnection(mockChannel);
            expect(handler.getActiveConnections()).toHaveLength(1);

            mockChannel.close();

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(handler.getActiveConnections()).toHaveLength(0);
        });

        test('should handle multiple concurrent connections', async () => {
            const channel1 = new MockChannel();
            const channel2 = new MockChannel();
            const channel3 = new MockChannel();

            await handler.handleConnection(channel1);
            await handler.handleConnection(channel2);
            await handler.handleConnection(channel3);

            expect(handler.getActiveConnections()).toHaveLength(3);

            channel1.close();
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(handler.getActiveConnections()).toHaveLength(2);

            channel2.close();
            channel3.close();
        });
    });

    describe('Request Handling', () => {
        test('should handle mobile/initialize request', async () => {
            await handler.handleConnection(mockChannel);

            const response = await handler.handleRequest('mobile/initialize', [{
                clientInfo: { name: 'TheiaMobile', version: '1.0.0' },
                capabilities: {}
            }]);

            expect(response).toHaveProperty('serverCapabilities');
            expect(response).toHaveProperty('mobileCapabilities');
            expect(response.mobileCapabilities).toHaveProperty('offlineMode');
            expect(response.mobileCapabilities).toHaveProperty('gestureSupport');
            expect(response.mobileCapabilities).toHaveProperty('hapticFeedback');
        });

        test('should return mobile-specific capabilities', async () => {
            await handler.handleConnection(mockChannel);

            const response = await handler.handleRequest('mobile/requestCapabilities', []);

            expect(response.offlineMode).toBe(true);
            expect(response.gestureSupport).toBe(true);
            expect(response.hapticFeedback).toBe(true);
            expect(response.backgroundSync).toBe(true);
        });

        test('should validate initialize options', async () => {
            await handler.handleConnection(mockChannel);

            await expect(
                handler.handleRequest('mobile/initialize', [null])
            ).rejects.toThrow('Invalid initialize options');
        });

        test('should require clientInfo in initialize', async () => {
            await handler.handleConnection(mockChannel);

            await expect(
                handler.handleRequest('mobile/initialize', [{ capabilities: {} }])
            ).rejects.toThrow('Invalid initialize options');
        });
    });

    describe('Error Handling', () => {
        test('should handle unknown method gracefully', async () => {
            await handler.handleConnection(mockChannel);

            await expect(
                handler.handleRequest('mobile/unknownMethod', [])
            ).rejects.toThrow('Unknown method: mobile/unknownMethod');
        });

        test('should handle malformed requests', async () => {
            await handler.handleConnection(mockChannel);

            await expect(
                handler.handleRequest('', [])
            ).rejects.toThrow();
        });

        test('should handle connection errors', async () => {
            await handler.handleConnection(mockChannel);
            
            const errorSpy = jest.fn();
            handler.onError(errorSpy);

            mockChannel.simulateError(new Error('Connection error'));

            expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('Connection State', () => {
        test('should track connection state', async () => {
            expect(handler.getActiveConnections()).toHaveLength(0);

            await handler.handleConnection(mockChannel);

            expect(handler.getActiveConnections()).toHaveLength(1);
        });

        test('should provide connection info', async () => {
            await handler.handleConnection(mockChannel);

            const connections = handler.getActiveConnections();
            expect(connections[0]).toHaveProperty('id');
            expect(connections[0]).toHaveProperty('createdAt');
        });
    });
});
