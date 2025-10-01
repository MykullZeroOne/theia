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

import { MobileSessionManager, MobileSessionState } from './mobile-session-manager';
import { MockChannel } from '../common/test/mock-channel';

describe('MobileSessionManager', () => {
    let sessionManager: MobileSessionManager;

    beforeEach(() => {
        sessionManager = new MobileSessionManager();
    });

    afterEach(() => {
        sessionManager.dispose();
    });

    describe('Session Creation', () => {
        test('should create new session with unique ID', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.id.length).toBeGreaterThan(0);
            expect(session.createdAt).toBeInstanceOf(Date);
        });

        test('should assign unique session IDs', async () => {
            const channel1 = new MockChannel();
            const channel2 = new MockChannel();

            const session1 = await sessionManager.createSession(channel1);
            const session2 = await sessionManager.createSession(channel2);

            expect(session1.id).not.toBe(session2.id);
        });

        test('should initialize session with empty state', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            expect(session.state).toBeDefined();
            expect(session.state.workspace).toBeUndefined();
            expect(session.state.openFiles).toEqual([]);
        });

        test('should track session creation time', async () => {
            const beforeCreate = new Date();
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);
            const afterCreate = new Date();

            expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(session.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        });
    });

    describe('Session Retrieval', () => {
        test('should retrieve existing session by ID', async () => {
            const channel = new MockChannel();
            const created = await sessionManager.createSession(channel);

            const retrieved = sessionManager.getSession(created.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
        });

        test('should return undefined for non-existent session', () => {
            const session = sessionManager.getSession('non-existent-id');
            expect(session).toBeUndefined();
        });

        test('should list all active sessions', async () => {
            const channel1 = new MockChannel();
            const channel2 = new MockChannel();
            const channel3 = new MockChannel();

            await sessionManager.createSession(channel1);
            await sessionManager.createSession(channel2);
            await sessionManager.createSession(channel3);

            const sessions = sessionManager.getAllSessions();
            expect(sessions).toHaveLength(3);
        });
    });

    describe('Session State Management', () => {
        test('should save session state', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const state: MobileSessionState = {
                workspace: '/tmp/test-workspace',
                openFiles: ['file1.ts', 'file2.ts'],
                activeFile: 'file1.ts',
                cursorPosition: { line: 10, column: 5 }
            };

            await sessionManager.saveSessionState(session.id, state);

            const retrieved = sessionManager.getSession(session.id);
            expect(retrieved?.state).toEqual(state);
        });

        test('should retrieve session state', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const state: MobileSessionState = {
                workspace: '/tmp/test',
                openFiles: ['test.ts']
            };

            await sessionManager.saveSessionState(session.id, state);
            const retrieved = await sessionManager.getSessionState(session.id);

            expect(retrieved).toEqual(state);
        });

        test('should return undefined for state of non-existent session', async () => {
            const state = await sessionManager.getSessionState('non-existent');
            expect(state).toBeUndefined();
        });

        test('should update existing session state', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const initialState: MobileSessionState = {
                workspace: '/tmp/workspace',
                openFiles: ['file1.ts']
            };

            await sessionManager.saveSessionState(session.id, initialState);

            const updatedState: MobileSessionState = {
                workspace: '/tmp/workspace',
                openFiles: ['file1.ts', 'file2.ts'],
                activeFile: 'file2.ts'
            };

            await sessionManager.saveSessionState(session.id, updatedState);

            const retrieved = await sessionManager.getSessionState(session.id);
            expect(retrieved).toEqual(updatedState);
            expect(retrieved?.openFiles).toHaveLength(2);
        });
    });

    describe('Session Restoration', () => {
        test('should restore session on reconnect', async () => {
            const channel1 = new MockChannel();
            const session1 = await sessionManager.createSession(channel1);

            const state: MobileSessionState = {
                workspace: '/tmp/workspace',
                openFiles: ['file1.ts', 'file2.ts'],
                activeFile: 'file1.ts'
            };

            await sessionManager.saveSessionState(session1.id, state);

            // Simulate disconnect
            await sessionManager.destroySession(session1.id);

            // Simulate reconnect with new channel
            const channel2 = new MockChannel();
            const session2 = await sessionManager.restoreSession(session1.id, channel2);

            expect(session2).toBeDefined();
            expect(session2?.id).toBe(session1.id);
            expect(session2?.state).toEqual(state);
        });

        test('should return undefined when restoring non-existent session', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.restoreSession('non-existent', channel);

            expect(session).toBeUndefined();
        });

        test('should update channel on restore', async () => {
            const channel1 = new MockChannel();
            const session1 = await sessionManager.createSession(channel1);

            await sessionManager.destroySession(session1.id);

            const channel2 = new MockChannel();
            const session2 = await sessionManager.restoreSession(session1.id, channel2);

            expect(session2?.channel).toBe(channel2);
        });

        test('should preserve session ID across restore', async () => {
            const channel1 = new MockChannel();
            const session1 = await sessionManager.createSession(channel1);
            const originalId = session1.id;

            await sessionManager.destroySession(session1.id);

            const channel2 = new MockChannel();
            const session2 = await sessionManager.restoreSession(originalId, channel2);

            expect(session2?.id).toBe(originalId);
        });
    });

    describe('Session Cleanup', () => {
        test('should destroy session and remove from active list', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            await sessionManager.destroySession(session.id);

            expect(sessionManager.getSession(session.id)).toBeUndefined();
            expect(sessionManager.getAllSessions()).toHaveLength(0);
        });

        test('should not throw when destroying non-existent session', async () => {
            await expect(
                sessionManager.destroySession('non-existent')
            ).resolves.not.toThrow();
        });

        test('should preserve state after destroy for restoration', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const state: MobileSessionState = {
                workspace: '/tmp/workspace',
                openFiles: ['file1.ts']
            };

            await sessionManager.saveSessionState(session.id, state);
            await sessionManager.destroySession(session.id);

            // State should still be retrievable for restoration
            const preservedState = await sessionManager.getSessionState(session.id);
            expect(preservedState).toEqual(state);
        });
    });

    describe('Session Expiration', () => {
        test('should cleanup expired sessions', async () => {
            jest.useFakeTimers();

            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            // Destroy session (mark as expired)
            await sessionManager.destroySession(session.id);

            // Fast-forward time past expiration (25 hours)
            jest.advanceTimersByTime(25 * 60 * 60 * 1000);

            await sessionManager.cleanupExpiredSessions();

            // State should be cleaned up
            const state = await sessionManager.getSessionState(session.id);
            expect(state).toBeUndefined();

            jest.useRealTimers();
        });

        test('should not cleanup non-expired sessions', async () => {
            jest.useFakeTimers();

            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const state: MobileSessionState = {
                workspace: '/tmp/workspace',
                openFiles: ['file1.ts']
            };

            await sessionManager.saveSessionState(session.id, state);
            await sessionManager.destroySession(session.id);

            // Fast-forward time but not past expiration (12 hours)
            jest.advanceTimersByTime(12 * 60 * 60 * 1000);

            await sessionManager.cleanupExpiredSessions();

            // State should still exist
            const preservedState = await sessionManager.getSessionState(session.id);
            expect(preservedState).toBeDefined();

            jest.useRealTimers();
        });

        test('should keep active sessions regardless of age', async () => {
            jest.useFakeTimers();

            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            // Fast-forward time way past expiration
            jest.advanceTimersByTime(100 * 60 * 60 * 1000);

            await sessionManager.cleanupExpiredSessions();

            // Active session should still exist
            const retrieved = sessionManager.getSession(session.id);
            expect(retrieved).toBeDefined();

            jest.useRealTimers();
        });
    });

    describe('Session Metadata', () => {
        test('should track last activity time', async () => {
            const channel = new MockChannel();
            const session = await sessionManager.createSession(channel);

            const initialActivity = session.lastActivityAt;

            // Simulate activity by saving state
            await new Promise(resolve => setTimeout(resolve, 10));

            await sessionManager.saveSessionState(session.id, {
                workspace: '/tmp/workspace',
                openFiles: []
            });

            const retrieved = sessionManager.getSession(session.id);
            expect(retrieved?.lastActivityAt.getTime()).toBeGreaterThan(initialActivity.getTime());
        });

        test('should include client info in session', async () => {
            const channel = new MockChannel();
            const clientInfo = {
                name: 'TheiaMobile',
                version: '1.0.0',
                platform: 'iOS'
            };

            const session = await sessionManager.createSession(channel, clientInfo);

            expect(session.clientInfo).toEqual(clientInfo);
        });
    });
});
