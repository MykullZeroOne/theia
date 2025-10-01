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

describe('Mobile Project Structure', () => {
    const rootDir = path.resolve(__dirname, '..');

    test('mobile directories exist', () => {
        const mobileAppDir = path.join(rootDir, 'examples', 'mobile');
        const coreMobileDir = path.join(rootDir, 'packages', 'core-mobile');
        const docsDir = path.join(rootDir, 'docs', 'mobile');

        expect(fs.existsSync(mobileAppDir)).toBe(true);
        expect(fs.existsSync(coreMobileDir)).toBe(true);
        expect(fs.existsSync(docsDir)).toBe(true);
    });

    test('mobile directories are actually directories', () => {
        const mobileAppDir = path.join(rootDir, 'examples', 'mobile');
        const coreMobileDir = path.join(rootDir, 'packages', 'core-mobile');
        const docsDir = path.join(rootDir, 'docs', 'mobile');

        if (fs.existsSync(mobileAppDir)) {
            expect(fs.statSync(mobileAppDir).isDirectory()).toBe(true);
        }
        if (fs.existsSync(coreMobileDir)) {
            expect(fs.statSync(coreMobileDir).isDirectory()).toBe(true);
        }
        if (fs.existsSync(docsDir)) {
            expect(fs.statSync(docsDir).isDirectory()).toBe(true);
        }
    });
});
