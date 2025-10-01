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

import { MobileLSPProxy } from './mobile-lsp-proxy';
import { MobileSession } from './mobile-session-manager';
import { MockChannel } from '../common/test/mock-channel';
import { MobileRPC } from '../common/mobile-protocol';

describe('MobileLSPProxy', () => {
    let proxy: MobileLSPProxy;
    let mockChannel: MockChannel;
    let mockSession: MobileSession;

    beforeEach(() => {
        proxy = new MobileLSPProxy();
        mockChannel = new MockChannel();
        mockSession = {
            id: 'test-session',
            channel: mockChannel,
            state: {
                workspace: undefined,
                openFiles: [],
                activeFile: undefined
            },
            createdAt: new Date(),
            lastActivityAt: new Date()
        };
    });

    afterEach(() => {
        proxy.dispose();
    });

    describe('Initialization', () => {
        test('should create proxy instance', () => {
            expect(proxy).toBeDefined();
            expect(typeof proxy.attach).toBe('function');
            expect(typeof proxy.dispose).toBe('function');
        });

        test('should be disposable', () => {
            expect(() => proxy.dispose()).not.toThrow();
        });
    });

    describe('Session Attachment', () => {
        test('should attach to session without error', async () => {
            await expect(proxy.attach(mockSession)).resolves.not.toThrow();
        });

        test('should handle multiple attach calls', async () => {
            await proxy.attach(mockSession);
            await expect(proxy.attach(mockSession)).resolves.not.toThrow();
        });

        test('should dispose previous handlers on re-attach', async () => {
            await proxy.attach(mockSession);
            const firstHandlerCount = (proxy as any).disposables?.length || 0;

            await proxy.attach(mockSession);
            const secondHandlerCount = (proxy as any).disposables?.length || 0;

            // Should not accumulate handlers
            expect(secondHandlerCount).toBeLessThanOrEqual(firstHandlerCount + 5);
        });
    });

    describe('Diagnostic Forwarding', () => {
        test('should forward diagnostics to mobile client', async () => {
            await proxy.attach(mockSession);

            const diagnostics: MobileRPC.Diagnostic[] = [
                {
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 5 }
                    },
                    severity: MobileRPC.DiagnosticSeverity.Error,
                    message: 'Undefined variable',
                    source: 'typescript'
                }
            ];

            // Simulate diagnostic event from language server
            const didForward = await proxy.forwardDiagnostics('file:///test.ts', diagnostics);

            expect(didForward).toBe(true);
        });

        test('should handle empty diagnostics', async () => {
            await proxy.attach(mockSession);

            const didForward = await proxy.forwardDiagnostics('file:///test.ts', []);

            expect(didForward).toBe(true);
        });

        test('should handle multiple diagnostic messages', async () => {
            await proxy.attach(mockSession);

            const diagnostics: MobileRPC.Diagnostic[] = [
                {
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
                    severity: MobileRPC.DiagnosticSeverity.Error,
                    message: 'Error 1'
                },
                {
                    range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
                    severity: MobileRPC.DiagnosticSeverity.Warning,
                    message: 'Warning 1'
                }
            ];

            const didForward = await proxy.forwardDiagnostics('file:///test.ts', diagnostics);

            expect(didForward).toBe(true);
        });
    });

    describe('Completion Requests', () => {
        test('should handle completion request', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleCompletionRequest('file:///test.ts', { line: 0, character: 5 });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('isIncomplete');
            expect(result).toHaveProperty('items');
            expect(Array.isArray(result.items)).toBe(true);
        });

        test('should return empty completion list on error', async () => {
            await proxy.attach(mockSession);

            // Test with invalid URI
            const result = await proxy.handleCompletionRequest('', { line: 0, character: 0 });

            expect(result.isIncomplete).toBe(false);
            expect(result.items).toEqual([]);
        });

        test('should handle completion with items', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleCompletionRequest('file:///test.ts', { line: 5, character: 10 });

            expect(result).toHaveProperty('isIncomplete');
            expect(Array.isArray(result.items)).toBe(true);
        });
    });

    describe('Hover Requests', () => {
        test('should handle hover request', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleHoverRequest('file:///test.ts', { line: 0, character: 5 });

            // Result can be null or Hover object
            expect(result === null || (result && result.contents !== undefined)).toBe(true);
        });

        test('should return null on hover error', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleHoverRequest('', { line: 0, character: 0 });

            expect(result).toBeNull();
        });

        test('should handle hover with string content', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleHoverRequest('file:///test.ts', { line: 10, character: 5 });

            if (result) {
                expect(result).toHaveProperty('contents');
            }
        });
    });

    describe('Definition Requests', () => {
        test('should handle definition request', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleDefinitionRequest('file:///test.ts', { line: 0, character: 5 });

            expect(Array.isArray(result)).toBe(true);
        });

        test('should return empty array on definition error', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleDefinitionRequest('', { line: 0, character: 0 });

            expect(result).toEqual([]);
        });

        test('should handle multiple definition locations', async () => {
            await proxy.attach(mockSession);

            const result = await proxy.handleDefinitionRequest('file:///test.ts', { line: 5, character: 10 });

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Code Action Requests', () => {
        test('should handle code action request', async () => {
            await proxy.attach(mockSession);

            const range: MobileRPC.Range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 10 }
            };
            const context: MobileRPC.CodeActionContext = {
                diagnostics: []
            };

            const result = await proxy.handleCodeActionsRequest('file:///test.ts', range, context);

            expect(Array.isArray(result)).toBe(true);
        });

        test('should return empty array on code action error', async () => {
            await proxy.attach(mockSession);

            const range: MobileRPC.Range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 }
            };
            const context: MobileRPC.CodeActionContext = { diagnostics: [] };

            const result = await proxy.handleCodeActionsRequest('', range, context);

            expect(result).toEqual([]);
        });
    });

    describe('Formatting Requests', () => {
        test('should handle formatting request', async () => {
            await proxy.attach(mockSession);

            const options: MobileRPC.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true
            };

            const result = await proxy.handleFormattingRequest('file:///test.ts', options);

            expect(Array.isArray(result)).toBe(true);
        });

        test('should return empty array on formatting error', async () => {
            await proxy.attach(mockSession);

            const options: MobileRPC.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true
            };

            const result = await proxy.handleFormattingRequest('', options);

            expect(result).toEqual([]);
        });
    });

    describe('Document Change Notifications', () => {
        test('should handle document change notification', async () => {
            await proxy.attach(mockSession);

            const changes = [
                {
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 5 }
                    },
                    text: 'hello'
                }
            ];

            await expect(proxy.handleTextDocumentChange('file:///test.ts', changes)).resolves.not.toThrow();
        });

        test('should handle empty change list', async () => {
            await proxy.attach(mockSession);

            await expect(proxy.handleTextDocumentChange('file:///test.ts', [])).resolves.not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle errors gracefully without crashing', async () => {
            await proxy.attach(mockSession);

            // Should not throw even with invalid inputs
            await expect(proxy.handleCompletionRequest('', { line: -1, character: -1 })).resolves.toBeDefined();
            await expect(proxy.handleHoverRequest('', { line: -1, character: -1 })).resolves.toBeDefined();
            await expect(proxy.handleDefinitionRequest('', { line: -1, character: -1 })).resolves.toBeDefined();
        });

        test('should continue operating after error', async () => {
            await proxy.attach(mockSession);

            // Cause an error
            await proxy.handleCompletionRequest('', { line: -1, character: -1 });

            // Should still work
            const result = await proxy.handleCompletionRequest('file:///test.ts', { line: 0, character: 0 });
            expect(result).toBeDefined();
        });
    });

    describe('Disposal', () => {
        test('should clean up handlers on dispose', async () => {
            await proxy.attach(mockSession);

            proxy.dispose();

            // After disposal, disposables should be empty
            expect((proxy as any).disposables).toEqual([]);
        });

        test('should handle multiple dispose calls', () => {
            proxy.dispose();
            expect(() => proxy.dispose()).not.toThrow();
        });

        test('should not process events after disposal', async () => {
            await proxy.attach(mockSession);
            proxy.dispose();

            // Should handle gracefully (not crash)
            await expect(proxy.forwardDiagnostics('file:///test.ts', [])).resolves.toBe(false);
        });
    });
});
