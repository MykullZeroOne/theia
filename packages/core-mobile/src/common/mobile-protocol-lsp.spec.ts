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

import { MobileRPC } from './mobile-protocol';
import { MobileLSPGuards } from './mobile-protocol-guards';

describe('Mobile LSP Protocol Types', () => {
    describe('Position', () => {
        test('should create valid position', () => {
            const pos: MobileRPC.Position = { line: 10, character: 5 };
            expect(pos.line).toBe(10);
            expect(pos.character).toBe(5);
        });

        test('should validate valid position', () => {
            const pos: MobileRPC.Position = { line: 0, character: 0 };
            expect(MobileLSPGuards.isValidPosition(pos)).toBe(true);
        });

        test('should reject position with negative line', () => {
            const invalid = { line: -1, character: 0 };
            expect(MobileLSPGuards.isValidPosition(invalid)).toBe(false);
        });

        test('should reject position with negative character', () => {
            const invalid = { line: 0, character: -1 };
            expect(MobileLSPGuards.isValidPosition(invalid)).toBe(false);
        });

        test('should reject position with missing fields', () => {
            expect(MobileLSPGuards.isValidPosition({})).toBe(false);
            expect(MobileLSPGuards.isValidPosition({ line: 0 })).toBe(false);
        });
    });

    describe('Range', () => {
        test('should create valid range', () => {
            const range: MobileRPC.Range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 }
            };
            expect(range.start.line).toBe(0);
            expect(range.end.character).toBe(5);
        });

        test('should validate valid range', () => {
            const range: MobileRPC.Range = {
                start: { line: 0, character: 0 },
                end: { line: 5, character: 10 }
            };
            expect(MobileLSPGuards.isValidRange(range)).toBe(true);
        });

        test('should reject range with invalid positions', () => {
            const invalid = {
                start: { line: -1, character: 0 },
                end: { line: 0, character: 5 }
            };
            expect(MobileLSPGuards.isValidRange(invalid)).toBe(false);
        });
    });

    describe('Diagnostic', () => {
        test('should create valid diagnostic', () => {
            const diag: MobileRPC.Diagnostic = {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 }
                },
                severity: MobileRPC.DiagnosticSeverity.Error,
                message: 'Undefined variable'
            };
            expect(diag.message).toBe('Undefined variable');
            expect(diag.severity).toBe(1);
        });

        test('should validate complete diagnostic', () => {
            const diag: MobileRPC.Diagnostic = {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 }
                },
                severity: MobileRPC.DiagnosticSeverity.Warning,
                code: 'TS2304',
                source: 'typescript',
                message: 'Cannot find name'
            };
            expect(MobileLSPGuards.isValidDiagnostic(diag)).toBe(true);
        });

        test('should reject diagnostic without message', () => {
            const invalid = {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 }
                }
            };
            expect(MobileLSPGuards.isValidDiagnostic(invalid)).toBe(false);
        });

        test('should accept diagnostic without severity', () => {
            const diag: MobileRPC.Diagnostic = {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 }
                },
                message: 'Warning'
            };
            expect(MobileLSPGuards.isValidDiagnostic(diag)).toBe(true);
        });
    });

    describe('CompletionItem', () => {
        test('should create valid completion item', () => {
            const item: MobileRPC.CompletionItem = {
                label: 'console',
                kind: MobileRPC.CompletionItemKind.Variable,
                detail: 'console object',
                insertText: 'console'
            };
            expect(item.label).toBe('console');
            expect(item.kind).toBe(6);
        });

        test('should validate completion item', () => {
            const item: MobileRPC.CompletionItem = {
                label: 'log',
                kind: MobileRPC.CompletionItemKind.Method
            };
            expect(MobileLSPGuards.isValidCompletionItem(item)).toBe(true);
        });

        test('should reject completion without label', () => {
            const invalid = { kind: 2 };
            expect(MobileLSPGuards.isValidCompletionItem(invalid)).toBe(false);
        });
    });

    describe('CompletionList', () => {
        test('should create valid completion list', () => {
            const list: MobileRPC.CompletionList = {
                isIncomplete: false,
                items: [
                    { label: 'foo', kind: MobileRPC.CompletionItemKind.Function },
                    { label: 'bar', kind: MobileRPC.CompletionItemKind.Variable }
                ]
            };
            expect(list.items).toHaveLength(2);
        });

        test('should validate completion list', () => {
            const list: MobileRPC.CompletionList = {
                isIncomplete: true,
                items: []
            };
            expect(MobileLSPGuards.isValidCompletionList(list)).toBe(true);
        });
    });

    describe('Hover', () => {
        test('should create string hover', () => {
            const hover: MobileRPC.Hover = {
                contents: 'function foo(): void'
            };
            expect(typeof hover.contents).toBe('string');
        });

        test('should create MarkupContent hover', () => {
            const hover: MobileRPC.Hover = {
                contents: {
                    kind: 'markdown',
                    value: '## Function\n```typescript\nfoo(): void\n```'
                }
            };
            expect(typeof hover.contents !== 'string' && hover.contents.kind).toBe('markdown');
        });

        test('should validate hover', () => {
            const hover: MobileRPC.Hover = {
                contents: 'hover text',
                range: {
                    start: { line: 5, character: 0 },
                    end: { line: 5, character: 3 }
                }
            };
            expect(MobileLSPGuards.isValidHover(hover)).toBe(true);
        });
    });

    describe('Location', () => {
        test('should create valid location', () => {
            const loc: MobileRPC.Location = {
                uri: 'file:///test.ts',
                range: {
                    start: { line: 10, character: 0 },
                    end: { line: 10, character: 10 }
                }
            };
            expect(loc.uri).toContain('file://');
        });

        test('should validate location', () => {
            const loc: MobileRPC.Location = {
                uri: 'file:///src/index.ts',
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 1 }
                }
            };
            expect(MobileLSPGuards.isValidLocation(loc)).toBe(true);
        });
    });
});
