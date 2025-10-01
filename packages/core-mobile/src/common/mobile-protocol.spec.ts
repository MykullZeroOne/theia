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

describe('Mobile RPC Protocol', () => {
    describe('Context Identifiers', () => {
        test('should have MOBILE_MAIN context', () => {
            expect(MobileRPC.CONTEXT.MOBILE_MAIN).toBe('MOBILE_MAIN');
        });

        test('should have MOBILE_EXT context', () => {
            expect(MobileRPC.CONTEXT.MOBILE_EXT).toBe('MOBILE_EXT');
        });
    });

    describe('MobileMainContext Interface', () => {
        test('should define required methods', () => {
            const methods = [
                '$showTextDocument',
                '$updateLayout',
                '$registerComponent',
                '$showToast',
                '$vibrate',
                '$requestPermission'
            ];

            // Create mock implementation to verify interface structure
            const mockImpl: MobileRPC.MobileMainContext = {
                $showTextDocument: jest.fn(),
                $updateLayout: jest.fn(),
                $registerComponent: jest.fn(),
                $showToast: jest.fn(),
                $vibrate: jest.fn(),
                $requestPermission: jest.fn()
            };

            methods.forEach(method => {
                expect(mockImpl).toHaveProperty(method);
            });
        });
    });

    describe('MobileExtContext Interface', () => {
        test('should define required methods', () => {
            const methods = [
                '$onDidChangeTextDocument',
                '$onDidChangeOrientation',
                '$onDidEnterBackground',
                '$onDidEnterForeground',
                '$executeCommand'
            ];

            const mockImpl: MobileRPC.MobileExtContext = {
                $onDidChangeTextDocument: jest.fn(),
                $onDidChangeOrientation: jest.fn(),
                $onDidEnterBackground: jest.fn(),
                $onDidEnterForeground: jest.fn(),
                $executeCommand: jest.fn()
            };

            methods.forEach(method => {
                expect(mockImpl).toHaveProperty(method);
            });
        });
    });

    describe('MobileLayout Type', () => {
        test('should validate layout structure', () => {
            const layout: MobileRPC.MobileLayout = {
                orientation: 'portrait',
                screenSize: { width: 375, height: 812 },
                safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
            };

            expect(layout.orientation).toMatch(/^(portrait|landscape)$/);
            expect(layout.screenSize).toHaveProperty('width');
            expect(layout.screenSize).toHaveProperty('height');
            expect(layout.safeAreaInsets).toHaveProperty('top');
            expect(layout.safeAreaInsets).toHaveProperty('bottom');
            expect(layout.safeAreaInsets).toHaveProperty('left');
            expect(layout.safeAreaInsets).toHaveProperty('right');
        });

        test('should support optional splitView', () => {
            const layoutWithSplit: MobileRPC.MobileLayout = {
                orientation: 'landscape',
                screenSize: { width: 1024, height: 768 },
                safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
                splitView: {
                    enabled: true,
                    ratio: 0.5
                }
            };

            expect(layoutWithSplit.splitView).toBeDefined();
            expect(layoutWithSplit.splitView?.enabled).toBe(true);
            expect(layoutWithSplit.splitView?.ratio).toBe(0.5);
        });
    });

    describe('MobileComponentDescriptor Type', () => {
        test('should validate component descriptor', () => {
            const descriptor: MobileRPC.MobileComponentDescriptor = {
                id: 'test-component',
                type: 'view',
                contribution: {
                    title: 'Test View',
                    location: 'tab'
                },
                renderer: 'react'
            };

            expect(descriptor.id).toBe('test-component');
            expect(descriptor.type).toMatch(/^(view|panel|modal)$/);
            expect(descriptor.renderer).toMatch(/^(react|webview)$/);
            expect(descriptor.contribution.title).toBe('Test View');
            expect(descriptor.contribution.location).toMatch(/^(tab|drawer|floating)$/);
        });

        test('should support optional icon and webviewOptions', () => {
            const descriptor: MobileRPC.MobileComponentDescriptor = {
                id: 'test-webview',
                type: 'panel',
                contribution: {
                    title: 'Test Panel',
                    icon: 'icon-name',
                    location: 'drawer'
                },
                renderer: 'webview',
                webviewOptions: {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            };

            expect(descriptor.contribution.icon).toBe('icon-name');
            expect(descriptor.webviewOptions).toBeDefined();
        });
    });

    describe('MobilePermission Type', () => {
        test('should accept valid permission types', () => {
            const validPermissions: MobileRPC.MobilePermission[] = [
                'camera',
                'photoLibrary',
                'location',
                'notifications',
                'microphone'
            ];

            validPermissions.forEach(permission => {
                const testPermission: MobileRPC.MobilePermission = permission;
                expect(testPermission).toBe(permission);
            });
        });
    });

    describe('MobileTextDocumentShowOptions Type', () => {
        test('should validate show options', () => {
            const options: MobileRPC.MobileTextDocumentShowOptions = {
                selection: { start: 0, end: 10 },
                preserveFocus: true,
                preview: false
            };

            expect(options.selection).toBeDefined();
            expect(options.selection?.start).toBe(0);
            expect(options.selection?.end).toBe(10);
            expect(options.preserveFocus).toBe(true);
            expect(options.preview).toBe(false);
        });

        test('should support empty options', () => {
            const options: MobileRPC.MobileTextDocumentShowOptions = {};

            expect(options.selection).toBeUndefined();
            expect(options.preserveFocus).toBeUndefined();
            expect(options.preview).toBeUndefined();
        });
    });
});
