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

import { MobileProtocolGuards } from './mobile-protocol-guards';

describe('Mobile Protocol Guards', () => {
    describe('isValidOrientation', () => {
        test('should accept valid orientations', () => {
            expect(MobileProtocolGuards.isValidOrientation('portrait')).toBe(true);
            expect(MobileProtocolGuards.isValidOrientation('landscape')).toBe(true);
        });

        test('should reject invalid orientations', () => {
            expect(MobileProtocolGuards.isValidOrientation('vertical')).toBe(false);
            expect(MobileProtocolGuards.isValidOrientation('')).toBe(false);
            expect(MobileProtocolGuards.isValidOrientation(null as any)).toBe(false);
            expect(MobileProtocolGuards.isValidOrientation(undefined as any)).toBe(false);
        });
    });

    describe('isValidLayout', () => {
        test('should validate complete layout', () => {
            const validLayout = {
                orientation: 'portrait',
                screenSize: { width: 375, height: 812 },
                safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
            };
            expect(MobileProtocolGuards.isValidLayout(validLayout)).toBe(true);
        });

        test('should validate layout with splitView', () => {
            const validLayout = {
                orientation: 'landscape',
                screenSize: { width: 1024, height: 768 },
                safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
                splitView: {
                    enabled: true,
                    ratio: 0.5
                }
            };
            expect(MobileProtocolGuards.isValidLayout(validLayout)).toBe(true);
        });

        test('should reject incomplete layout', () => {
            expect(MobileProtocolGuards.isValidLayout({ orientation: 'portrait' })).toBe(false);
            expect(MobileProtocolGuards.isValidLayout(null as any)).toBe(false);
            expect(MobileProtocolGuards.isValidLayout(undefined as any)).toBe(false);
        });

        test('should reject layout with invalid orientation', () => {
            const invalidLayout = {
                orientation: 'invalid',
                screenSize: { width: 375, height: 812 },
                safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
            };
            expect(MobileProtocolGuards.isValidLayout(invalidLayout)).toBe(false);
        });

        test('should reject layout with invalid screenSize', () => {
            const invalidLayout = {
                orientation: 'portrait',
                screenSize: { width: -1, height: 812 },
                safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }
            };
            expect(MobileProtocolGuards.isValidLayout(invalidLayout)).toBe(false);
        });
    });

    describe('isValidComponentType', () => {
        test('should accept valid component types', () => {
            expect(MobileProtocolGuards.isValidComponentType('view')).toBe(true);
            expect(MobileProtocolGuards.isValidComponentType('panel')).toBe(true);
            expect(MobileProtocolGuards.isValidComponentType('modal')).toBe(true);
        });

        test('should reject invalid component types', () => {
            expect(MobileProtocolGuards.isValidComponentType('window')).toBe(false);
            expect(MobileProtocolGuards.isValidComponentType('')).toBe(false);
            expect(MobileProtocolGuards.isValidComponentType(null as any)).toBe(false);
        });
    });

    describe('isValidComponentDescriptor', () => {
        test('should validate complete descriptor', () => {
            const descriptor = {
                id: 'test-component',
                type: 'view',
                contribution: {
                    title: 'Test View',
                    location: 'tab'
                },
                renderer: 'react'
            };
            expect(MobileProtocolGuards.isValidComponentDescriptor(descriptor)).toBe(true);
        });

        test('should reject descriptor without required fields', () => {
            const incomplete = {
                id: 'test',
                type: 'view'
            };
            expect(MobileProtocolGuards.isValidComponentDescriptor(incomplete)).toBe(false);
        });

        test('should reject descriptor with invalid type', () => {
            const invalid = {
                id: 'test-component',
                type: 'invalid',
                contribution: {
                    title: 'Test View',
                    location: 'tab'
                },
                renderer: 'react'
            };
            expect(MobileProtocolGuards.isValidComponentDescriptor(invalid)).toBe(false);
        });
    });

    describe('isValidPermission', () => {
        test('should accept valid permissions', () => {
            expect(MobileProtocolGuards.isValidPermission('camera')).toBe(true);
            expect(MobileProtocolGuards.isValidPermission('photoLibrary')).toBe(true);
            expect(MobileProtocolGuards.isValidPermission('location')).toBe(true);
            expect(MobileProtocolGuards.isValidPermission('notifications')).toBe(true);
            expect(MobileProtocolGuards.isValidPermission('microphone')).toBe(true);
        });

        test('should reject invalid permissions', () => {
            expect(MobileProtocolGuards.isValidPermission('storage')).toBe(false);
            expect(MobileProtocolGuards.isValidPermission('')).toBe(false);
            expect(MobileProtocolGuards.isValidPermission(null as any)).toBe(false);
        });
    });
});
