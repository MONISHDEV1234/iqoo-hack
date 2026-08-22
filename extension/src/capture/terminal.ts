/**
 * capture/terminal.ts — Terminal Shell Integration capture.
 *
 * Uses VS Code's Shell Integration API:
 *   onDidStartTerminalShellExecution  → grab command text
 *   onDidEndTerminalShellExecution    → grab exit code + output
 *
 * Classifies known test runner commands and tags them as test_run with pass/fail.
 */

import * as vscode from "vscode";
import type { SessionBuffer, BufferEvent } from "../buffer";

// Known test runner patterns
const TEST_RUNNER_RE =
  /\b(pytest|npm\s+test|yarn\s+test|go\s+test|jest|mvn\s+test|cargo\s+test|npx\s+jest|vitest|mocha)\b/i;

const PASS_OUTPUT_RE = /\b(\d+)\s+passed\b/i;
const FAIL_OUTPUT_RE = /\b(\d+)\s+(failed|error)/i;

const MAX_OUTPUT_CHARS = 4000;

export function registerTerminalCapture(
  ctx: vscode.ExtensionContext,
  buffer: SessionBuffer,
  isEnabled: () => boolean
): void {
  // Capture output per-execution
  ctx.subscriptions.push(
    vscode.window.onDidStartTerminalShellExecution(async (e) => {
      if (!isEnabled()) { return; }
      const command = e.execution.commandLine?.value ?? "";

      // Read output stream asynchronously
      let output = "";
      try {
        for await (const chunk of e.execution.read()) {
          output += chunk;
          if (output.length > MAX_OUTPUT_CHARS) {
            output = output.slice(0, MAX_OUTPUT_CHARS);
            break;
          }
        }
      } catch {
        // Shell integration may not expose output in all terminals — that's fine
      }

      const exitCode: number =
        (e as unknown as { exitCode?: number }).exitCode ?? 0;

      const isTestRun = TEST_RUNNER_RE.test(command);
      let result: "passed" | "failed" | undefined;
      if (isTestRun) {
        if (exitCode !== 0 || FAIL_OUTPUT_RE.test(output)) {
          result = "failed";
        } else {
          result = "passed";
        }
      }

      const ev: BufferEvent = {
        ts: Date.now(),
        type: "terminal",
        data: {
          command,
          exit_code: exitCode,
          output,
          is_test_run: isTestRun,
          result,
        },
      };
      buffer.push(ev);
    })
  );

  // Fallback: also listen to onDidEndTerminalShellExecution for exit code
  ctx.subscriptions.push(
    vscode.window.onDidEndTerminalShellExecution((e) => {
      if (!isEnabled()) { return; }
      const command = e.execution.commandLine?.value ?? "";
      const exitCode = e.exitCode ?? 0;
      const isTestRun = TEST_RUNNER_RE.test(command);

      // Only push if not already pushed by start event (simple dedup by command+ts window)
      const ev: BufferEvent = {
        ts: Date.now(),
        type: "terminal",
        data: {
          command,
          exit_code: exitCode,
          output: "",
          is_test_run: isTestRun,
          result: isTestRun
            ? exitCode === 0
              ? "passed"
              : "failed"
            : undefined,
          from_end_event: true,
        },
      };
      buffer.push(ev);
    })
  );
}
