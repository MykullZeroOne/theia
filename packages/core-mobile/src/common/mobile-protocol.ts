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

export namespace MobileRPC {
    export const CONTEXT = {
        MOBILE_MAIN: 'MOBILE_MAIN',
        MOBILE_EXT: 'MOBILE_EXT'
    };

    export interface MobileMainContext {
        $showTextDocument(uri: string, options?: MobileTextDocumentShowOptions): Promise<void>;
        $updateLayout(layout: MobileLayout): Promise<void>;
        $registerComponent(component: MobileComponentDescriptor): Promise<void>;
        $showToast(message: string, type: 'info' | 'warning' | 'error'): Promise<void>;
        $vibrate(pattern: number[]): Promise<void>;
        $requestPermission(permission: MobilePermission): Promise<boolean>;
    }

    export interface MobileExtContext {
        $onDidChangeTextDocument(uri: string, changes: TextDocumentContentChangeEvent[]): void;
        $onDidChangeOrientation(orientation: 'portrait' | 'landscape'): void;
        $onDidEnterBackground(): void;
        $onDidEnterForeground(): void;
        $executeCommand(command: string, ...args: any[]): Promise<any>;
    }

    export interface MobileLayout {
        orientation: 'portrait' | 'landscape';
        screenSize: { width: number; height: number };
        safeAreaInsets: { top: number; bottom: number; left: number; right: number };
        splitView?: {
            enabled: boolean;
            ratio: number;
        };
    }

    export interface MobileComponentDescriptor {
        id: string;
        type: 'view' | 'panel' | 'modal';
        contribution: {
            title: string;
            icon?: string;
            location: 'tab' | 'drawer' | 'floating';
        };
        renderer: 'react' | 'webview';
        component?: any;
        webviewOptions?: any;
    }

    export type MobilePermission =
        | 'camera'
        | 'photoLibrary'
        | 'location'
        | 'notifications'
        | 'microphone';

    export interface MobileTextDocumentShowOptions {
        selection?: { start: number; end: number };
        preserveFocus?: boolean;
        preview?: boolean;
    }

    export interface TextDocumentContentChangeEvent {
        range?: { start: number; end: number };
        rangeLength?: number;
        text: string;
    }
}
