/**
 * capture/fileSaves.ts — File save event capture.
 * Captures file path, language, timestamp on save.
 * Does NOT capture file contents (keeps buffer light).
 */

import * as vscode from "vscode";
import type { SessionBuffer, BufferEvent } from "../buffer";

export function registerFileSavesCapture(
  ctx: vscode.ExtensionContext,
  buffer: SessionBuffer,
  isEnabled: () => boolean
): void {
  ctx.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!isEnabled()) { return; }
      const ev: BufferEvent = {
        ts: Date.now(),
        type: "file_save",
        data: {
          file_path: doc.uri.fsPath,
          language: doc.languageId,
        },
      };
      buffer.push(ev);
    })
  );
}
