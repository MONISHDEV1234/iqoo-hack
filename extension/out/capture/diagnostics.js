"use strict";
/**
 * capture/diagnostics.ts — Compiler/lint error capture via Diagnostics API.
 *
 * Debounces onDidChangeDiagnostics to avoid noise while typing.
 * Only captures Error-severity diagnostics by default.
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
exports.registerDiagnosticsCapture = registerDiagnosticsCapture;
const vscode = __importStar(require("vscode"));
const DEBOUNCE_MS = 1500;
function registerDiagnosticsCapture(ctx, buffer, isEnabled) {
    let debounceTimer = null;
    ctx.subscriptions.push(vscode.languages.onDidChangeDiagnostics((e) => {
        if (!isEnabled()) {
            return;
        }
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            for (const uri of e.uris) {
                const diags = vscode.languages.getDiagnostics(uri);
                for (const d of diags) {
                    // Only capture Errors (severity 0) — skip warnings/hints to keep buffer light
                    if (d.severity !== vscode.DiagnosticSeverity.Error) {
                        continue;
                    }
                    const ev = {
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
    }));
}
//# sourceMappingURL=diagnostics.js.map