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

export namespace LanguageProfileGuards {
    export function isValidLanguageConfig(value: any): value is MobileRPC.LanguageConfig {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (typeof value.id !== 'string' || value.id.length === 0) {
            return false;
        }

        if (typeof value.name !== 'string' || value.name.length === 0) {
            return false;
        }

        if (!Array.isArray(value.extensions) || value.extensions.length === 0) {
            return false;
        }

        if (!value.extensions.every((ext: any) => typeof ext === 'string')) {
            return false;
        }

        if (typeof value.lspServer !== 'string' || value.lspServer.length === 0) {
            return false;
        }

        if (typeof value.treeSitterGrammar !== 'string' || value.treeSitterGrammar.length === 0) {
            return false;
        }

        if (typeof value.downloadUrl !== 'string' || value.downloadUrl.length === 0) {
            return false;
        }

        if (typeof value.size !== 'number' || value.size <= 0) {
            return false;
        }

        return true;
    }

    export function isValidLanguageStackProfile(value: any): value is MobileRPC.LanguageStackProfile {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (typeof value.id !== 'string' || value.id.length === 0) {
            return false;
        }

        if (typeof value.name !== 'string' || value.name.length === 0) {
            return false;
        }

        if (typeof value.description !== 'string') {
            return false;
        }

        if (!Array.isArray(value.languages) || value.languages.length === 0) {
            return false;
        }

        if (!value.languages.every((lang: any) => isValidLanguageConfig(lang))) {
            return false;
        }

        if (typeof value.estimatedSize !== 'number' || value.estimatedSize <= 0) {
            return false;
        }

        if (typeof value.icon !== 'string' || value.icon.length === 0) {
            return false;
        }

        return true;
    }

    export function isValidProfileSwitchRequest(value: any): value is MobileRPC.ProfileSwitchRequest {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (typeof value.profileId !== 'string' || value.profileId.length === 0) {
            return false;
        }

        return true;
    }

    export function isValidProfileSwitchProgress(value: any): value is MobileRPC.ProfileSwitchProgress {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const validPhases = ['downloading', 'installing', 'unloading', 'complete', 'error'];
        if (!validPhases.includes(value.phase)) {
            return false;
        }

        if (typeof value.languageId !== 'string' || value.languageId.length === 0) {
            return false;
        }

        if (typeof value.percent !== 'number' || value.percent < 0 || value.percent > 100) {
            return false;
        }

        if (typeof value.downloadedBytes !== 'number' || value.downloadedBytes < 0) {
            return false;
        }

        if (typeof value.totalBytes !== 'number' || value.totalBytes < 0) {
            return false;
        }

        if (value.error !== undefined && typeof value.error !== 'string') {
            return false;
        }

        return true;
    }

    export function isValidActiveProfileInfo(value: any): value is MobileRPC.ActiveProfileInfo {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (typeof value.profileId !== 'string' || value.profileId.length === 0) {
            return false;
        }

        if (!Array.isArray(value.installedLanguages)) {
            return false;
        }

        if (!value.installedLanguages.every((lang: any) => typeof lang === 'string')) {
            return false;
        }

        if (typeof value.totalSize !== 'number' || value.totalSize < 0) {
            return false;
        }

        if (typeof value.lastSwitched !== 'number' || value.lastSwitched < 0) {
            return false;
        }

        return true;
    }
}
