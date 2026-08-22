/**
 * capture/diagnostics.ts — Compiler/lint error capture via Diagnostics API.
 *
 * Debounces onDidChangeDiagnostics to avoid noise while typing.
 * Only captures Error-severity diagnostics by default.
 */

import * as vscode from "vscode";
import type { SessionBuffer, BufferEvent } from "../buffer";

const DEBOUNCE_MS = 1500;

export function registerDiagnosticsCapture(
  ctx: vscode.ExtensionContext,
  buffer: SessionBuffer,
  isEnabled: () => boolean
): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ctx.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics((e) => {
      if (!isEnabled()) { return; }

      if (debounceTimer) { clearTimeout(debounceTimer); }
      debounceTimer = setTimeout(() => {
        for (const uri of e.uris) {
          const diags = vscode.languages.getDiagnostics(uri);
          for (const d of diags) {
            // Only capture Errors (severity 0) — skip warnings/hints to keep buffer light
            if (d.severity !== vscode.DiagnosticSeverity.Error) { continue; }

            const ev: BufferEvent = {
              ts: Date.now(),
              type: "diagnostic",
              data: {
                file: uri.fsPath,
                message: d.message,
                severity: "error",
                source: d.source ?? "",
                line: d.range.start.line + 1,
                code: d.code?.toString() ?? "",
              },
            };
            buffer.push(ev);
          }
        }
      }, DEBOUNCE_MS);
    })
  );
}
