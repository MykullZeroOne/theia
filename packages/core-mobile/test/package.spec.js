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

const fs = require('fs');
const path = require('path');

describe('Core Mobile Package', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');

    test('package.json exists', () => {
        expect(fs.existsSync(packagePath)).toBe(true);
    });

    test('package.json has required fields', () => {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        expect(pkg.name).toBe('@theia/core-mobile');
        expect(pkg.version).toBeDefined();
        expect(pkg.description).toBeDefined();
        expect(pkg.dependencies).toBeDefined();
        expect(pkg.dependencies['@theia/core']).toBeDefined();
    });

    test('package.json has correct license', () => {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        expect(pkg.license).toBe('EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0');
    });

    test('package.json has theiaExtensions configuration', () => {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        expect(pkg.theiaExtensions).toBeDefined();
        expect(Array.isArray(pkg.theiaExtensions)).toBe(true);
    });
});

describe('Core Mobile TypeScript Config', () => {
    const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');

    test('tsconfig.json exists', () => {
        expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    test('tsconfig extends base configuration', () => {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        expect(tsconfig.extends).toBe('../../configs/base.tsconfig.json');
    });

    test('tsconfig has correct compilerOptions', () => {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        expect(tsconfig.compilerOptions).toBeDefined();
        expect(tsconfig.compilerOptions.rootDir).toBe('src');
        expect(tsconfig.compilerOptions.outDir).toBe('lib');
    });
});
