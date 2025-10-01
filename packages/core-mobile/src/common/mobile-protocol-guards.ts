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

export namespace MobileProtocolGuards {
    export function isValidOrientation(value: any): value is 'portrait' | 'landscape' {
        return value === 'portrait' || value === 'landscape';
    }

    export function isValidLayout(value: any): value is MobileRPC.MobileLayout {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (!isValidOrientation(value.orientation)) {
            return false;
        }

        if (!value.screenSize || typeof value.screenSize !== 'object') {
            return false;
        }

        if (typeof value.screenSize.width !== 'number' || value.screenSize.width <= 0) {
            return false;
        }

        if (typeof value.screenSize.height !== 'number' || value.screenSize.height <= 0) {
            return false;
        }

        if (!value.safeAreaInsets || typeof value.safeAreaInsets !== 'object') {
            return false;
        }

        const requiredInsets = ['top', 'bottom', 'left', 'right'];
        for (const inset of requiredInsets) {
            if (typeof value.safeAreaInsets[inset] !== 'number') {
                return false;
            }
        }

        if (value.splitView !== undefined) {
            if (typeof value.splitView !== 'object') {
                return false;
            }
            if (typeof value.splitView.enabled !== 'boolean') {
                return false;
            }
            if (typeof value.splitView.ratio !== 'number') {
                return false;
            }
        }

        return true;
    }

    export function isValidComponentType(value: any): value is 'view' | 'panel' | 'modal' {
        return value === 'view' || value === 'panel' || value === 'modal';
    }

    export function isValidRendererType(value: any): value is 'react' | 'webview' {
        return value === 'react' || value === 'webview';
    }

    export function isValidLocation(value: any): value is 'tab' | 'drawer' | 'floating' {
        return value === 'tab' || value === 'drawer' || value === 'floating';
    }

    export function isValidComponentDescriptor(value: any): value is MobileRPC.MobileComponentDescriptor {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (typeof value.id !== 'string' || value.id.length === 0) {
            return false;
        }

        if (!isValidComponentType(value.type)) {
            return false;
        }

        if (!value.contribution || typeof value.contribution !== 'object') {
            return false;
        }

        if (typeof value.contribution.title !== 'string' || value.contribution.title.length === 0) {
            return false;
        }

        if (!isValidLocation(value.contribution.location)) {
            return false;
        }

        if (!isValidRendererType(value.renderer)) {
            return false;
        }

        return true;
    }

    export function isValidPermission(value: any): value is MobileRPC.MobilePermission {
        const validPermissions: MobileRPC.MobilePermission[] = [
            'camera',
            'photoLibrary',
            'location',
            'notifications',
            'microphone'
        ];
        return validPermissions.includes(value);
    }
}

export namespace MobileLSPGuards {
    export function isValidPosition(value: any): value is MobileRPC.Position {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (typeof value.line !== 'number' || value.line < 0) {
            return false;
        }
        if (typeof value.character !== 'number' || value.character < 0) {
            return false;
        }
        return true;
    }

    export function isValidRange(value: any): value is MobileRPC.Range {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (!isValidPosition(value.start)) {
            return false;
        }
        if (!isValidPosition(value.end)) {
            return false;
        }
        return true;
    }

    export function isValidDiagnostic(value: any): value is MobileRPC.Diagnostic {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (!isValidRange(value.range)) {
            return false;
        }
        if (typeof value.message !== 'string' || value.message.length === 0) {
            return false;
        }
        if (value.severity !== undefined) {
            if (typeof value.severity !== 'number' || value.severity < 1 || value.severity > 4) {
                return false;
            }
        }
        if (value.code !== undefined) {
            if (typeof value.code !== 'string' && typeof value.code !== 'number') {
                return false;
            }
        }
        if (value.source !== undefined && typeof value.source !== 'string') {
            return false;
        }
        return true;
    }

    export function isValidCompletionItem(value: any): value is MobileRPC.CompletionItem {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (typeof value.label !== 'string' || value.label.length === 0) {
            return false;
        }
        if (value.kind !== undefined) {
            if (typeof value.kind !== 'number' || value.kind < 1 || value.kind > 25) {
                return false;
            }
        }
        if (value.detail !== undefined && typeof value.detail !== 'string') {
            return false;
        }
        if (value.insertText !== undefined && typeof value.insertText !== 'string') {
            return false;
        }
        return true;
    }

    export function isValidCompletionList(value: any): value is MobileRPC.CompletionList {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (typeof value.isIncomplete !== 'boolean') {
            return false;
        }
        if (!Array.isArray(value.items)) {
            return false;
        }
        for (const item of value.items) {
            if (!isValidCompletionItem(item)) {
                return false;
            }
        }
        return true;
    }

    export function isValidMarkupContent(value: any): value is MobileRPC.MarkupContent {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (value.kind !== 'plaintext' && value.kind !== 'markdown') {
            return false;
        }
        if (typeof value.value !== 'string') {
            return false;
        }
        return true;
    }

    export function isValidHover(value: any): value is MobileRPC.Hover {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (!value.contents) {
            return false;
        }
        if (typeof value.contents === 'string') {
            return true;
        }
        if (!isValidMarkupContent(value.contents)) {
            return false;
        }
        if (value.range !== undefined && !isValidRange(value.range)) {
            return false;
        }
        return true;
    }

    export function isValidLocation(value: any): value is MobileRPC.Location {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (typeof value.uri !== 'string' || value.uri.length === 0) {
            return false;
        }
        if (!isValidRange(value.range)) {
            return false;
        }
        return true;
    }
}
