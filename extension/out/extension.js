"use strict";
/**
 * extension.ts — Entry point. Activates all capture listeners, registers commands.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const buffer_1 = require("./buffer");
const terminal_1 = require("./capture/terminal");
const diagnostics_1 = require("./capture/diagnostics");
const fileSaves_1 = require("./capture/fileSaves");
const SidebarProvider_1 = require("./sidebar/SidebarProvider");
const apiClient_1 = require("./apiClient");
let captureEnabled = true;
const api = new apiClient_1.ApiClient();
function activate(ctx) {
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    // ── Ring buffer ──────────────────────────────────────────────────────────
    const buffer = new buffer_1.SessionBuffer(async (events, reason) => {
        vscode.window.setStatusBarMessage(`MistakeMemo: extracting (${reason})…`, 4000);
        try {
            const result = await api.extract({
                events,
                project: vscode.workspace.name ?? "",
                workspace,
            });
            sidebarProvider.notifyExtraction(result, reason);
            vscode.window.showInformationMessage(`MistakeMemo: experience extracted (${reason})`);
        }
        catch (err) {
            vscode.window.showWarningMessage(`MistakeMemo: extraction failed — ${err}. Is the backend running?`);
        }
    });
    // ── Capture listeners ────────────────────────────────────────────────────
    const isEnabled = () => captureEnabled;
    (0, terminal_1.registerTerminalCapture)(ctx, buffer, isEnabled);
    (0, diagnostics_1.registerDiagnosticsCapture)(ctx, buffer, isEnabled);
    (0, fileSaves_1.registerFileSavesCapture)(ctx, buffer, isEnabled);
    // ── Sidebar ──────────────────────────────────────────────────────────────
    const sidebarProvider = new SidebarProvider_1.SidebarProvider(ctx, buffer, api, isEnabled, (v) => {
        captureEnabled = v;
        updateStatusBar();
    });
    ctx.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider_1.SidebarProvider.VIEW_ID, sidebarProvider));
    // ── Status bar ───────────────────────────────────────────────────────────
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = "mistakememo.toggleCapture";
    ctx.subscriptions.push(statusBar);
    function updateStatusBar() {
        statusBar.text = captureEnabled
            ? "$(record) MistakeMemo: ON"
            : "$(circle-slash) MistakeMemo: OFF";
        statusBar.tooltip = "Click to toggle MistakeMemo capture";
        statusBar.show();
    }
    updateStatusBar();
    // ── Commands ─────────────────────────────────────────────────────────────
    ctx.subscriptions.push(vscode.commands.registerCommand("mistakememo.toggleCapture", () => {
        captureEnabled = !captureEnabled;
        updateStatusBar();
        vscode.window.showInformationMessage(`MistakeMemo capture ${captureEnabled ? "enabled" : "disabled"}`);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand("mistakememo.extractNow", () => {
        buffer.extractNow();
        vscode.window.showInformationMessage("MistakeMemo: manual extraction triggered");
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand("mistakememo.openSidebar", () => {
        vscode.commands.executeCommand("workbench.view.extension.mistakememo-sidebar");
    }));
    // ── Cleanup on workspace close ───────────────────────────────────────────
    ctx.subscriptions.push({
        dispose: () => {
            buffer.dispose();
        },
    });
    console.log("[MistakeMemo] Extension activated");
}
function deactivate() {
    console.log("[MistakeMemo] Extension deactivated");
}
//# sourceMappingURL=extension.js.map