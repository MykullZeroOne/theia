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

import { Container } from '@theia/core/shared/inversify';
import { MobileBackendModule } from './mobile-backend-module';
import { MobileConnectionHandler } from './mobile-connection-handler';
import { MobileSessionManager } from './mobile-session-manager';
import { MobileLSPProxy } from './mobile-lsp-proxy';

describe('Mobile Backend Module', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.load(MobileBackendModule);
    });

    describe('Service Bindings', () => {
        test('should bind MobileConnectionHandler', () => {
            const handler = container.get(MobileConnectionHandler);
            expect(handler).toBeInstanceOf(MobileConnectionHandler);
        });

        test('should bind MobileSessionManager', () => {
            const manager = container.get(MobileSessionManager);
            expect(manager).toBeInstanceOf(MobileSessionManager);
        });

        test('should bind MobileLSPProxy', () => {
            const proxy = container.get(MobileLSPProxy);
            expect(proxy).toBeInstanceOf(MobileLSPProxy);
        });
    });

    describe('Singleton Scope', () => {
        test('MobileConnectionHandler should be singleton', () => {
            const handler1 = container.get(MobileConnectionHandler);
            const handler2 = container.get(MobileConnectionHandler);
            expect(handler1).toBe(handler2);
        });

        test('MobileSessionManager should be singleton', () => {
            const manager1 = container.get(MobileSessionManager);
            const manager2 = container.get(MobileSessionManager);
            expect(manager1).toBe(manager2);
        });

        test('MobileLSPProxy should be singleton', () => {
            const proxy1 = container.get(MobileLSPProxy);
            const proxy2 = container.get(MobileLSPProxy);
            expect(proxy1).toBe(proxy2);
        });
    });

    describe('Service Initialization', () => {
        test('should initialize services without errors', () => {
            expect(() => {
                container.get(MobileConnectionHandler);
                container.get(MobileSessionManager);
                container.get(MobileLSPProxy);
            }).not.toThrow();
        });

        test('services should have expected methods', () => {
            const handler = container.get(MobileConnectionHandler);
            expect(typeof handler.handleConnection).toBe('function');
            expect(typeof handler.getActiveConnections).toBe('function');

            const manager = container.get(MobileSessionManager);
            expect(typeof manager.createSession).toBe('function');
            expect(typeof manager.getSession).toBe('function');

            const proxy = container.get(MobileLSPProxy);
            expect(typeof proxy.attach).toBe('function');
            expect(typeof proxy.dispose).toBe('function');
        });
    });

    describe('Multiple Container Instances', () => {
        test('should create independent service instances per container', () => {
            const container2 = new Container();
            container2.load(MobileBackendModule);

            const handler1 = container.get(MobileConnectionHandler);
            const handler2 = container2.get(MobileConnectionHandler);

            expect(handler1).not.toBe(handler2);
        });
    });
});
