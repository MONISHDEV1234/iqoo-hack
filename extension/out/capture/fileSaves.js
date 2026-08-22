"use strict";
/**
 * capture/fileSaves.ts — File save event capture.
 * Captures file path, language, timestamp on save.
 * Does NOT capture file contents (keeps buffer light).
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
exports.registerFileSavesCapture = registerFileSavesCapture;
const vscode = __importStar(require("vscode"));
function registerFileSavesCapture(ctx, buffer, isEnabled) {
    ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!isEnabled()) {
            return;
        }
        const ev = {
            ts: Date.now(),
            type: "file_save",
            data: {
                file_path: doc.uri.fsPath,
                language: doc.languageId,
            },
        };
        buffer.push(ev);
    }));
}
//# sourceMappingURL=fileSaves.js.map