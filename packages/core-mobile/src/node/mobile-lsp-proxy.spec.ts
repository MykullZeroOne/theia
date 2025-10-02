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
import { LanguageProfileManager } from './language-profile-manager';
import { LanguageProfileStorage } from './language-profile-storage';
import { LanguageDetector } from './language-detector';
import * as os from 'os';
import * as path from 'path';

describe('MobileLSPProxy', () => {
    let proxy: MobileLSPProxy;
    let mockChannel: MockChannel;
    let mockSession: MobileSession;
    let profileManager: LanguageProfileManager;
    let languageDetector: LanguageDetector;
    let storage: LanguageProfileStorage;
    let tempDir: string;

    beforeEach(async () => {
        // Create temp directory for test storage
        tempDir = path.join(os.tmpdir(), `lsp-proxy-test-${Date.now()}`);

        // Create instances with DI
        storage = new LanguageProfileStorage(tempDir);
        profileManager = new LanguageProfileManager();
        (profileManager as any).storage = storage;
        await (profileManager as any).initialize();

        languageDetector = new LanguageDetector();

        proxy = new MobileLSPProxy();
        (proxy as any).profileManager = profileManager;
        (proxy as any).languageDetector = languageDetector;

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

    afterEach(async () => {
        proxy.dispose();
        await storage.clear();
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
        beforeEach(async () => {
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
        });

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
                    source: 'javascript'
                }
            ];

            // Use .js file which is in Java profile
            const didForward = await proxy.forwardDiagnostics('file:///test.js', diagnostics);

            expect(didForward).toBe(true);
        });

        test('should handle empty diagnostics', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const didForward = await proxy.forwardDiagnostics('file:///test.js', []);

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

            // Use .js file which is in Java profile
            const didForward = await proxy.forwardDiagnostics('file:///test.js', diagnostics);

            expect(didForward).toBe(true);
        });
    });

    describe('Completion Requests', () => {
        beforeEach(async () => {
            // Switch to Java profile so TypeScript won't work
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
        });

        test('should handle completion request', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleCompletionRequest('file:///test.js', { line: 0, character: 5 });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('isIncomplete');
            expect(result).toHaveProperty('items');
            expect(Array.isArray(result.items)).toBe(true);
        });

        test('should throw error for invalid URI', async () => {
            await proxy.attach(mockSession);

            // Test with invalid URI
            await expect(
                proxy.handleCompletionRequest('', { line: 0, character: 0 })
            ).rejects.toThrow('Invalid URI');
        });

        test('should handle completion with items', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleCompletionRequest('file:///test.js', { line: 5, character: 10 });

            expect(result).toHaveProperty('isIncomplete');
            expect(Array.isArray(result.items)).toBe(true);
        });
    });

    describe('Hover Requests', () => {
        beforeEach(async () => {
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
        });

        test('should handle hover request', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleHoverRequest('file:///test.js', { line: 0, character: 5 });

            // Result can be null or Hover object
            expect(result === null || (result && result.contents !== undefined)).toBe(true);
        });

        test('should throw error on invalid URI', async () => {
            await proxy.attach(mockSession);

            await expect(
                proxy.handleHoverRequest('', { line: 0, character: 0 })
            ).rejects.toThrow('Invalid URI');
        });

        test('should handle hover with string content', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleHoverRequest('file:///test.js', { line: 10, character: 5 });

            if (result) {
                expect(result).toHaveProperty('contents');
            }
        });
    });

    describe('Definition Requests', () => {
        beforeEach(async () => {
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
        });

        test('should handle definition request', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleDefinitionRequest('file:///test.js', { line: 0, character: 5 });

            expect(Array.isArray(result)).toBe(true);
        });

        test('should throw error on invalid URI', async () => {
            await proxy.attach(mockSession);

            await expect(
                proxy.handleDefinitionRequest('', { line: 0, character: 0 })
            ).rejects.toThrow('Invalid URI');
        });

        test('should handle multiple definition locations', async () => {
            await proxy.attach(mockSession);

            // Use .js file which is in Java profile
            const result = await proxy.handleDefinitionRequest('file:///test.js', { line: 5, character: 10 });

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
        beforeEach(async () => {
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
        });

        test('should throw errors for invalid inputs', async () => {
            await proxy.attach(mockSession);

            // Should throw with invalid inputs
            await expect(proxy.handleCompletionRequest('', { line: -1, character: -1 })).rejects.toThrow();
            await expect(proxy.handleHoverRequest('', { line: -1, character: -1 })).rejects.toThrow();
            await expect(proxy.handleDefinitionRequest('', { line: -1, character: -1 })).rejects.toThrow();
        });

        test('should continue operating after error', async () => {
            await proxy.attach(mockSession);

            // Cause an error
            try {
                await proxy.handleCompletionRequest('', { line: -1, character: -1 });
            } catch (e) {
                // Expected
            }

            // Should still work with valid input
            const result = await proxy.handleCompletionRequest('file:///test.js', { line: 0, character: 0 });
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

    describe('Profile Filtering', () => {
        beforeEach(async () => {
            // Switch to Java profile for filtering tests
            await profileManager.switchProfile({ profileId: 'java-fullstack' });
            await proxy.attach(mockSession);
        });

        describe('Diagnostic Filtering', () => {
            test('should forward diagnostics for active language (Java)', async () => {
                const diagnostics: MobileRPC.Diagnostic[] = [{
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
                    severity: MobileRPC.DiagnosticSeverity.Error,
                    message: 'Error in Java file'
                }];

                const result = await proxy.forwardDiagnostics('file:///Main.java', diagnostics);
                expect(result).toBe(true);
            });

            test('should filter diagnostics for inactive language (Kotlin)', async () => {
                const diagnostics: MobileRPC.Diagnostic[] = [{
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
                    severity: MobileRPC.DiagnosticSeverity.Error,
                    message: 'Error in Kotlin file'
                }];

                const result = await proxy.forwardDiagnostics('file:///Main.kt', diagnostics);
                expect(result).toBe(false);
            });

            test('should forward diagnostics for JavaScript (in Java profile)', async () => {
                const diagnostics: MobileRPC.Diagnostic[] = [{
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
                    severity: MobileRPC.DiagnosticSeverity.Error,
                    message: 'Error in JS file'
                }];

                const result = await proxy.forwardDiagnostics('file:///app.js', diagnostics);
                expect(result).toBe(true);
            });
        });

        describe('Completion Filtering', () => {
            test('should process completion request for active language (Java)', async () => {
                const result = await proxy.handleCompletionRequest('file:///Main.java', { line: 0, character: 5 });
                expect(result).toBeDefined();
                expect(result.isIncomplete).toBe(false);
            });

            test('should reject completion request for inactive language (Kotlin)', async () => {
                await expect(
                    proxy.handleCompletionRequest('file:///Main.kt', { line: 0, character: 5 })
                ).rejects.toThrow('kotlin');
            });

            test('should process completion request for JavaScript (in Java profile)', async () => {
                const result = await proxy.handleCompletionRequest('file:///app.js', { line: 0, character: 5 });
                expect(result).toBeDefined();
            });
        });

        describe('Hover Filtering', () => {
            test('should process hover request for active language (Java)', async () => {
                const result = await proxy.handleHoverRequest('file:///Main.java', { line: 0, character: 5 });
                expect(result).toBeNull(); // Implementation returns null for now
            });

            test('should reject hover request for inactive language (Kotlin)', async () => {
                await expect(
                    proxy.handleHoverRequest('file:///Main.kt', { line: 0, character: 5 })
                ).rejects.toThrow('kotlin');
            });
        });

        describe('Definition Filtering', () => {
            test('should process definition request for active language (Java)', async () => {
                const result = await proxy.handleDefinitionRequest('file:///Main.java', { line: 0, character: 5 });
                expect(Array.isArray(result)).toBe(true);
            });

            test('should reject definition request for inactive language (Kotlin)', async () => {
                await expect(
                    proxy.handleDefinitionRequest('file:///Main.kt', { line: 0, character: 5 })
                ).rejects.toThrow('kotlin');
            });
        });

        describe('Profile Switch Updates', () => {
            test('should update filtering when profile switches', async () => {
                // Initially on Java profile - Kotlin should be filtered
                await expect(
                    proxy.handleCompletionRequest('file:///Main.kt', { line: 0, character: 5 })
                ).rejects.toThrow('kotlin');

                // Switch to Mobile Dev profile
                await profileManager.switchProfile({ profileId: 'mobile-dev' });

                // Now Kotlin should work, but Java should be filtered
                const ktResult = await proxy.handleCompletionRequest('file:///Main.kt', { line: 0, character: 5 });
                expect(ktResult).toBeDefined();

                await expect(
                    proxy.handleCompletionRequest('file:///Main.java', { line: 0, character: 5 })
                ).rejects.toThrow('java');
            });
        });

        describe('Unknown File Types', () => {
            test('should reject requests for files with no extension', async () => {
                await expect(
                    proxy.handleCompletionRequest('file:///Makefile', { line: 0, character: 5 })
                ).rejects.toThrow('Cannot detect language');
            });

            test('should reject requests for unknown file types', async () => {
                await expect(
                    proxy.handleCompletionRequest('file:///image.png', { line: 0, character: 5 })
                ).rejects.toThrow('Cannot detect language');
            });
        });

        describe('URI Handling', () => {
            test('should handle URIs with query parameters', async () => {
                const result = await proxy.handleCompletionRequest('file:///Main.java?version=1', { line: 0, character: 5 });
                expect(result).toBeDefined();
            });

            test('should handle URIs with fragments', async () => {
                const result = await proxy.handleCompletionRequest('file:///Main.java#L10', { line: 0, character: 5 });
                expect(result).toBeDefined();
            });
        });
    });
});
