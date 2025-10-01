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

describe('Mobile npm Scripts', () => {
    const rootDir = path.resolve(__dirname, '..');
    const packageJsonPath = path.join(rootDir, 'package.json');

    test('root package.json has mobile scripts', () => {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(pkg.scripts).toBeDefined();
        expect(pkg.scripts['mobile:install']).toBeDefined();
        expect(pkg.scripts['mobile:test']).toBeDefined();
        expect(pkg.scripts['mobile:build']).toBeDefined();
        expect(pkg.scripts['mobile:watch']).toBeDefined();
    });

    test('mobile:install script points to mobile directory', () => {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(pkg.scripts['mobile:install']).toContain('examples/mobile');
        expect(pkg.scripts['mobile:install']).toContain('npm install');
    });

    test('mobile:test script uses lerna', () => {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(pkg.scripts['mobile:test']).toContain('lerna run test');
        expect(pkg.scripts['mobile:test']).toContain('mobile');
    });

    test('mobile:build script compiles core-mobile package', () => {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(pkg.scripts['mobile:build']).toContain('lerna run compile');
        expect(pkg.scripts['mobile:build']).toContain('@theia/core-mobile');
    });

    test('mobile:watch script watches core-mobile package', () => {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(pkg.scripts['mobile:watch']).toContain('lerna run watch');
        expect(pkg.scripts['mobile:watch']).toContain('@theia/core-mobile');
    });
});
