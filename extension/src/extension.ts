/**
 * extension.ts — Entry point. Activates all capture listeners, registers commands.
 */

import * as vscode from "vscode";
import { SessionBuffer } from "./buffer";
import { registerTerminalCapture } from "./capture/terminal";
import { registerDiagnosticsCapture } from "./capture/diagnostics";
import { registerFileSavesCapture } from "./capture/fileSaves";
import { SidebarProvider } from "./sidebar/SidebarProvider";
import { ApiClient } from "./apiClient";

let captureEnabled = true;
const api = new ApiClient();

export function activate(ctx: vscode.ExtensionContext): void {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";

  // ── Ring buffer ──────────────────────────────────────────────────────────
  const buffer = new SessionBuffer(async (events, reason) => {
    vscode.window.setStatusBarMessage(`MistakeMemo: extracting (${reason})…`, 4000);
    try {
      const result = await api.extract({
        events,
        project: vscode.workspace.name ?? "",
        workspace,
      });
      sidebarProvider.notifyExtraction(result, reason);
      vscode.window.showInformationMessage(
        `MistakeMemo: experience extracted (${reason})`
      );
    } catch (err) {
      vscode.window.showWarningMessage(
        `MistakeMemo: extraction failed — ${err}. Is the backend running?`
      );
    }
  });

  // ── Capture listeners ────────────────────────────────────────────────────
  const isEnabled = () => captureEnabled;
  registerTerminalCapture(ctx, buffer, isEnabled);
  registerDiagnosticsCapture(ctx, buffer, isEnabled);
  registerFileSavesCapture(ctx, buffer, isEnabled);

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebarProvider = new SidebarProvider(
    ctx,
    buffer,
    api,
    isEnabled,
    (v) => {
      captureEnabled = v;
      updateStatusBar();
    }
  );
  ctx.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.VIEW_ID, sidebarProvider)
  );

  // ── Status bar ───────────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = "mistakememo.toggleCapture";
  ctx.subscriptions.push(statusBar);

  function updateStatusBar(): void {
    statusBar.text = captureEnabled
      ? "$(record) MistakeMemo: ON"
      : "$(circle-slash) MistakeMemo: OFF";
    statusBar.tooltip = "Click to toggle MistakeMemo capture";
    statusBar.show();
  }
  updateStatusBar();

  // ── Commands ─────────────────────────────────────────────────────────────
  ctx.subscriptions.push(
    vscode.commands.registerCommand("mistakememo.toggleCapture", () => {
      captureEnabled = !captureEnabled;
      updateStatusBar();
      vscode.window.showInformationMessage(
        `MistakeMemo capture ${captureEnabled ? "enabled" : "disabled"}`
      );
    })
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand("mistakememo.extractNow", () => {
      buffer.extractNow();
      vscode.window.showInformationMessage("MistakeMemo: manual extraction triggered");
    })
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand("mistakememo.openSidebar", () => {
      vscode.commands.executeCommand("workbench.view.extension.mistakememo-sidebar");
    })
  );

  // ── Cleanup on workspace close ───────────────────────────────────────────
  ctx.subscriptions.push({
    dispose: () => {
      buffer.dispose();
    },
  });

  console.log("[MistakeMemo] Extension activated");
}

export function deactivate(): void {
  console.log("[MistakeMemo] Extension deactivated");
}
