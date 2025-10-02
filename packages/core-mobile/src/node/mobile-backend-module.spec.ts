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
import { LanguageProfileManager } from './language-profile-manager';
import { LanguageProfileStorage } from './language-profile-storage';
import { LanguageDetector } from './language-detector';

describe('Mobile Backend Module', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.load(MobileBackendModule);
    });

    describe('Service Bindings', () => {
        test('should bind MobileConnectionHandler', async () => {
            const handler = await container.getAsync(MobileConnectionHandler);
            expect(handler).toBeInstanceOf(MobileConnectionHandler);
        });

        test('should bind MobileSessionManager', async () => {
            const manager = await container.getAsync(MobileSessionManager);
            expect(manager).toBeInstanceOf(MobileSessionManager);
        });

        test('should bind MobileLSPProxy', async () => {
            const proxy = await container.getAsync(MobileLSPProxy);
            expect(proxy).toBeInstanceOf(MobileLSPProxy);
        });

        test('should bind LanguageProfileStorage', () => {
            const storage = container.get(LanguageProfileStorage);
            expect(storage).toBeInstanceOf(LanguageProfileStorage);
        });

        test('should bind LanguageProfileManager', async () => {
            const manager = await container.getAsync(LanguageProfileManager);
            expect(manager).toBeInstanceOf(LanguageProfileManager);
        });

        test('should bind LanguageDetector', () => {
            const detector = container.get(LanguageDetector);
            expect(detector).toBeInstanceOf(LanguageDetector);
        });
    });

    describe('Singleton Scope', () => {
        test('MobileConnectionHandler should be singleton', async () => {
            const handler1 = await container.getAsync(MobileConnectionHandler);
            const handler2 = await container.getAsync(MobileConnectionHandler);
            expect(handler1).toBe(handler2);
        });

        test('MobileSessionManager should be singleton', async () => {
            const manager1 = await container.getAsync(MobileSessionManager);
            const manager2 = await container.getAsync(MobileSessionManager);
            expect(manager1).toBe(manager2);
        });

        test('MobileLSPProxy should be singleton', async () => {
            const proxy1 = await container.getAsync(MobileLSPProxy);
            const proxy2 = await container.getAsync(MobileLSPProxy);
            expect(proxy1).toBe(proxy2);
        });

        test('LanguageProfileStorage should be singleton', () => {
            const storage1 = container.get(LanguageProfileStorage);
            const storage2 = container.get(LanguageProfileStorage);
            expect(storage1).toBe(storage2);
        });

        test('LanguageProfileManager should be singleton', async () => {
            const manager1 = await container.getAsync(LanguageProfileManager);
            const manager2 = await container.getAsync(LanguageProfileManager);
            expect(manager1).toBe(manager2);
        });
    });

    describe('Service Initialization', () => {
        test('should initialize services without errors', async () => {
            await expect(async () => {
                await container.getAsync(MobileConnectionHandler);
                await container.getAsync(MobileSessionManager);
                container.get(MobileLSPProxy);
                container.get(LanguageProfileStorage);
                await container.getAsync(LanguageProfileManager);
            }).resolves.not.toThrow();
        });

        test('services should have expected methods', async () => {
            const handler = await container.getAsync(MobileConnectionHandler);
            expect(typeof handler.handleConnection).toBe('function');
            expect(typeof handler.getActiveConnections).toBe('function');

            const manager = await container.getAsync(MobileSessionManager);
            expect(typeof manager.createSession).toBe('function');
            expect(typeof manager.getSession).toBe('function');

            const proxy = container.get(MobileLSPProxy);
            expect(typeof proxy.attach).toBe('function');
            expect(typeof proxy.dispose).toBe('function');

            const profileManager = await container.getAsync(LanguageProfileManager);
            expect(typeof profileManager.getAvailableProfiles).toBe('function');
            expect(typeof profileManager.getActiveProfile).toBe('function');
            expect(typeof profileManager.switchProfile).toBe('function');
        });
    });

    describe('Multiple Container Instances', () => {
        test('should create independent service instances per container', async () => {
            const container2 = new Container();
            container2.load(MobileBackendModule);

            const handler1 = await container.getAsync(MobileConnectionHandler);
            const handler2 = await container2.getAsync(MobileConnectionHandler);

            expect(handler1).not.toBe(handler2);
        });
    });
});
