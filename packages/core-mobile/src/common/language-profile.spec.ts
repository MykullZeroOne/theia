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
import { LanguageProfileGuards } from './language-profile-guards';

describe('Language Profile Types', () => {
    describe('LanguageConfig', () => {
        test('should create valid language config', () => {
            const config: MobileRPC.LanguageConfig = {
                id: 'java',
                name: 'Java',
                extensions: ['java'],
                lspServer: 'eclipse.jdt.ls',
                treeSitterGrammar: 'tree-sitter-java',
                downloadUrl: 'https://cdn.theia.io/lsp/java-lsp-v1.0.0.zip',
                size: 45000000
            };

            expect(config.id).toBe('java');
            expect(config.extensions).toContain('java');
            expect(config.size).toBeGreaterThan(0);
        });

        test('should validate language config', () => {
            const valid: MobileRPC.LanguageConfig = {
                id: 'typescript',
                name: 'TypeScript',
                extensions: ['ts', 'tsx'],
                lspServer: 'typescript-language-server',
                treeSitterGrammar: 'tree-sitter-typescript',
                downloadUrl: 'https://cdn.theia.io/lsp/ts-lsp.zip',
                size: 20000000
            };

            expect(LanguageProfileGuards.isValidLanguageConfig(valid)).toBe(true);
        });

        test('should reject invalid language config (missing id)', () => {
            const invalid = {
                name: 'Java',
                extensions: ['java'],
                lspServer: 'jdt.ls',
                treeSitterGrammar: 'tree-sitter-java',
                downloadUrl: 'https://example.com/lsp.zip',
                size: 1000
            };

            expect(LanguageProfileGuards.isValidLanguageConfig(invalid)).toBe(false);
        });

        test('should reject invalid language config (negative size)', () => {
            const invalid = {
                id: 'java',
                name: 'Java',
                extensions: ['java'],
                lspServer: 'jdt.ls',
                treeSitterGrammar: 'tree-sitter-java',
                downloadUrl: 'https://example.com/lsp.zip',
                size: -1000
            };

            expect(LanguageProfileGuards.isValidLanguageConfig(invalid)).toBe(false);
        });

        test('should reject invalid language config (empty extensions)', () => {
            const invalid = {
                id: 'java',
                name: 'Java',
                extensions: [],
                lspServer: 'jdt.ls',
                treeSitterGrammar: 'tree-sitter-java',
                downloadUrl: 'https://example.com/lsp.zip',
                size: 1000
            };

            expect(LanguageProfileGuards.isValidLanguageConfig(invalid)).toBe(false);
        });
    });

    describe('LanguageStackProfile', () => {
        test('should create valid profile', () => {
            const profile: MobileRPC.LanguageStackProfile = {
                id: 'java-fullstack',
                name: 'Java Full Stack',
                description: 'Backend Java, SQL, Frontend JS/HTML/CSS',
                languages: [
                    {
                        id: 'java',
                        name: 'Java',
                        extensions: ['java'],
                        lspServer: 'eclipse.jdt.ls',
                        treeSitterGrammar: 'tree-sitter-java',
                        downloadUrl: 'https://cdn.theia.io/lsp/java.zip',
                        size: 45000000
                    }
                ],
                estimatedSize: 45000000,
                icon: 'java-icon'
            };

            expect(profile.id).toBe('java-fullstack');
            expect(profile.languages).toHaveLength(1);
            expect(profile.estimatedSize).toBe(45000000);
        });

        test('should validate complete profile', () => {
            const profile: MobileRPC.LanguageStackProfile = {
                id: 'dotnet-fullstack',
                name: '.NET Full Stack',
                description: 'C# backend, SQL, TypeScript frontend',
                languages: [
                    {
                        id: 'csharp',
                        name: 'C#',
                        extensions: ['cs'],
                        lspServer: 'omnisharp',
                        treeSitterGrammar: 'tree-sitter-c-sharp',
                        downloadUrl: 'https://cdn.theia.io/lsp/omnisharp.zip',
                        size: 50000000
                    },
                    {
                        id: 'sql',
                        name: 'SQL',
                        extensions: ['sql'],
                        lspServer: 'sql-language-server',
                        treeSitterGrammar: 'tree-sitter-sql',
                        downloadUrl: 'https://cdn.theia.io/lsp/sql.zip',
                        size: 5000000
                    }
                ],
                estimatedSize: 55000000,
                icon: 'dotnet-icon'
            };

            expect(LanguageProfileGuards.isValidLanguageStackProfile(profile)).toBe(true);
        });

        test('should reject profile with empty languages', () => {
            const invalid = {
                id: 'empty',
                name: 'Empty Profile',
                description: 'No languages',
                languages: [],
                estimatedSize: 0,
                icon: 'icon'
            };

            expect(LanguageProfileGuards.isValidLanguageStackProfile(invalid)).toBe(false);
        });

        test('should reject profile with invalid language', () => {
            const invalid = {
                id: 'invalid',
                name: 'Invalid Profile',
                description: 'Has invalid language',
                languages: [
                    {
                        id: '',
                        name: 'Bad',
                        extensions: ['bad'],
                        lspServer: 'bad',
                        treeSitterGrammar: 'bad',
                        downloadUrl: 'bad',
                        size: -1
                    }
                ],
                estimatedSize: 0,
                icon: 'icon'
            };

            expect(LanguageProfileGuards.isValidLanguageStackProfile(invalid)).toBe(false);
        });
    });

    describe('ProfileRegistry', () => {
        test('should have predefined profiles', () => {
            const profiles = MobileRPC.LanguageProfiles.ALL_PROFILES;

            expect(profiles.length).toBeGreaterThan(0);
        });

        test('Java Full Stack profile should exist', () => {
            const javaProfile = MobileRPC.LanguageProfiles.JAVA_FULL_STACK;

            expect(javaProfile.id).toBe('java-fullstack');
            expect(javaProfile.languages.length).toBeGreaterThanOrEqual(3); // Java, SQL, JS at minimum
            expect(javaProfile.languages.some(l => l.id === 'java')).toBe(true);
        });

        test('.NET Full Stack profile should exist', () => {
            const dotnetProfile = MobileRPC.LanguageProfiles.DOTNET_FULL_STACK;

            expect(dotnetProfile.id).toBe('dotnet-fullstack');
            expect(dotnetProfile.languages.some(l => l.id === 'csharp')).toBe(true);
        });

        test('Mobile Dev profile should exist', () => {
            const mobileProfile = MobileRPC.LanguageProfiles.MOBILE_DEV;

            expect(mobileProfile.id).toBe('mobile-dev');
            expect(mobileProfile.languages.some(l => l.id === 'kotlin' || l.id === 'swift')).toBe(true);
        });

        test('should find profile by id', () => {
            const profile = MobileRPC.LanguageProfiles.findById('java-fullstack');

            expect(profile).toBeDefined();
            expect(profile?.id).toBe('java-fullstack');
        });

        test('should return undefined for unknown profile', () => {
            const profile = MobileRPC.LanguageProfiles.findById('non-existent');

            expect(profile).toBeUndefined();
        });
    });

    describe('ProfileSwitchRequest', () => {
        test('should create valid profile switch request', () => {
            const request: MobileRPC.ProfileSwitchRequest = {
                profileId: 'java-fullstack'
            };

            expect(request.profileId).toBe('java-fullstack');
        });

        test('should validate profile switch request', () => {
            const valid: MobileRPC.ProfileSwitchRequest = {
                profileId: 'dotnet-fullstack'
            };

            expect(LanguageProfileGuards.isValidProfileSwitchRequest(valid)).toBe(true);
        });

        test('should reject empty profile id', () => {
            const invalid = {
                profileId: ''
            };

            expect(LanguageProfileGuards.isValidProfileSwitchRequest(invalid)).toBe(false);
        });
    });

    describe('ProfileSwitchProgress', () => {
        test('should create valid progress event', () => {
            const progress: MobileRPC.ProfileSwitchProgress = {
                phase: 'downloading',
                languageId: 'java',
                percent: 50,
                downloadedBytes: 22500000,
                totalBytes: 45000000
            };

            expect(progress.phase).toBe('downloading');
            expect(progress.percent).toBe(50);
        });

        test('should validate progress event', () => {
            const valid: MobileRPC.ProfileSwitchProgress = {
                phase: 'installing',
                languageId: 'typescript',
                percent: 75,
                downloadedBytes: 15000000,
                totalBytes: 20000000
            };

            expect(LanguageProfileGuards.isValidProfileSwitchProgress(valid)).toBe(true);
        });

        test('should reject invalid percent (>100)', () => {
            const invalid = {
                phase: 'downloading',
                languageId: 'java',
                percent: 150,
                downloadedBytes: 1000,
                totalBytes: 1000
            };

            expect(LanguageProfileGuards.isValidProfileSwitchProgress(invalid)).toBe(false);
        });

        test('should reject invalid percent (negative)', () => {
            const invalid = {
                phase: 'downloading',
                languageId: 'java',
                percent: -10,
                downloadedBytes: 1000,
                totalBytes: 1000
            };

            expect(LanguageProfileGuards.isValidProfileSwitchProgress(invalid)).toBe(false);
        });
    });

    describe('ActiveProfileInfo', () => {
        test('should create valid active profile info', () => {
            const info: MobileRPC.ActiveProfileInfo = {
                profileId: 'java-fullstack',
                installedLanguages: ['java', 'sql', 'javascript'],
                totalSize: 70000000,
                lastSwitched: Date.now()
            };

            expect(info.installedLanguages).toHaveLength(3);
            expect(info.totalSize).toBeGreaterThan(0);
        });

        test('should validate active profile info', () => {
            const valid: MobileRPC.ActiveProfileInfo = {
                profileId: 'mobile-dev',
                installedLanguages: ['kotlin', 'swift'],
                totalSize: 55000000,
                lastSwitched: Date.now()
            };

            expect(LanguageProfileGuards.isValidActiveProfileInfo(valid)).toBe(true);
        });
    });
});
