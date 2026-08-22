"use strict";
/**
 * sidebar/SidebarProvider.ts — Webview sidebar panel.
 *
 * 4 sections:
 *   1. Capture status + toggle
 *   2. Paste/Import session
 *   3. Memory search (calls /experiences — Role 2)
 *   4. Ask/Reprocess with Memory (calls /llm/ask — Role 1)
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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
class SidebarProvider {
    constructor(ctx, buffer, api, getCapture, setCapture) {
        this.ctx = ctx;
        this.buffer = buffer;
        this.api = api;
        this.getCapture = getCapture;
        this.setCapture = setCapture;
    }
    resolveWebviewView(view, _context, _token) {
        this._view = view;
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.ctx.extensionUri, "media"),
            ],
        };
        view.webview.html = this._getHtml(view.webview);
        // Handle messages from webview
        view.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case "toggleCapture": {
                    this.setCapture(!this.getCapture());
                    this._post({ command: "captureStatus", enabled: this.getCapture() });
                    break;
                }
                case "extractNow": {
                    this.buffer.extractNow();
                    this._post({ command: "toast", text: "Extraction triggered." });
                    break;
                }
                case "pasteImport": {
                    const result = await this.api.extract({ raw_text: msg.text });
                    this._post({ command: "extractResult", result });
                    break;
                }
                case "search": {
                    const results = await this.api.listExperiences({ q: msg.query });
                    this._post({ command: "searchResults", results });
                    break;
                }
                case "askLLM": {
                    const result = await this.api.askLLM({
                        problem_text: msg.problem,
                        report_text: msg.report,
                        mode: msg.mode,
                    });
                    this._post({ command: "llmResponse", result });
                    break;
                }
                case "manualCreate": {
                    const result = await this.api.createExperience(msg.experience);
                    this._post({ command: "toast", text: `Created experience #${result.id}` });
                    break;
                }
                case "getCaptureStatus": {
                    this._post({ command: "captureStatus", enabled: this.getCapture() });
                    break;
                }
            }
        });
    }
    /** Send a message to the webview */
    _post(msg) {
        this._view?.webview.postMessage(msg);
    }
    /** Notify webview of a new extraction result */
    notifyExtraction(exp, reason) {
        this._post({ command: "extractionDone", exp, reason });
    }
    _getHtml(webview) {
        const nonce = Math.random().toString(36).slice(2);
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src 'unsafe-inline';
             script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MistakeMemo</title>
  <style>
    :root {
      --bg: var(--vscode-sideBar-background);
      --fg: var(--vscode-foreground);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --border: var(--vscode-panel-border);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--vscode-font-family); font-size: 13px;
           color: var(--fg); background: var(--bg); padding: 10px; }
    h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
         opacity: 0.7; margin: 14px 0 6px; }
    button {
      background: var(--accent); color: var(--accent-fg); border: none;
      padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;
      width: 100%; margin-top: 4px;
    }
    button.secondary { background: var(--vscode-button-secondaryBackground);
                       color: var(--vscode-button-secondaryForeground); }
    textarea, input {
      width: 100%; background: var(--input-bg); color: var(--input-fg);
      border: 1px solid var(--border); border-radius: 3px; padding: 5px;
      font-family: inherit; font-size: 12px; resize: vertical;
    }
    textarea { min-height: 70px; }
    .status-dot { display: inline-block; width: 8px; height: 8px;
                  border-radius: 50%; margin-right: 5px; }
    .on { background: #4ec9b0; } .off { background: #f44747; }
    #statusLabel { font-size: 12px; }
    .result-box {
      background: var(--vscode-editor-background);
      border: 1px solid var(--border); border-radius: 3px;
      padding: 6px; margin-top: 6px; font-size: 11px;
      max-height: 200px; overflow-y: auto; white-space: pre-wrap;
    }
    .toast { background: var(--vscode-notificationToast-background);
             color: var(--vscode-notificationToast-foreground);
             padding: 4px 8px; border-radius: 3px; margin-top: 6px;
             font-size: 11px; display: none; }
    select {
      width: 100%; background: var(--input-bg); color: var(--input-fg);
      border: 1px solid var(--border); border-radius: 3px; padding: 4px;
      font-size: 12px;
    }
    .section { border-top: 1px solid var(--border); padding-top: 8px; }
  </style>
</head>
<body>
<div id="toast" class="toast"></div>

<!-- ── Capture Status ─────────────────────────────── -->
<h3>Capture</h3>
<div>
  <span class="status-dot off" id="dot"></span>
  <span id="statusLabel">Off</span>
</div>
<button id="btnToggle" onclick="toggleCapture()">Toggle Capture</button>
<button class="secondary" onclick="extractNow()">⚡ Extract Now</button>

<!-- ── Paste / Import ─────────────────────────────── -->
<div class="section">
<h3>Paste / Import Session</h3>
<textarea id="pasteBox" placeholder="Paste terminal output or session log here…"></textarea>
<button onclick="pasteImport()">Import & Extract</button>
<div id="extractResult" class="result-box" style="display:none"></div>
</div>

<!-- ── Memory Search ──────────────────────────────── -->
<div class="section">
<h3>Memory Search</h3>
<input id="searchInput" type="text" placeholder="Search experiences…"/>
<button onclick="search()">Search</button>
<div id="searchResults" class="result-box" style="display:none"></div>
</div>

<!-- ── Ask / Reprocess with Memory ───────────────── -->
<div class="section">
<h3>Ask AI with Memory</h3>
<textarea id="problemInput" placeholder="Describe your current problem…"></textarea>
<textarea id="reportInput" placeholder="(Optional) Paste a MISTAKEMEMO_REPORT here…" style="min-height:50px"></textarea>
<select id="modeSelect">
  <option value="with_memory">With Memory</option>
  <option value="without_memory">Without Memory (baseline)</option>
</select>
<button onclick="askLLM()">Ask AI</button>
<div id="llmResult" class="result-box" style="display:none"></div>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

// Init
vscode.postMessage({ command: 'getCaptureStatus' });

function toggleCapture() { vscode.postMessage({ command: 'toggleCapture' }); }
function extractNow()    { vscode.postMessage({ command: 'extractNow' }); }

function pasteImport() {
  const text = document.getElementById('pasteBox').value.trim();
  if (!text) return;
  vscode.postMessage({ command: 'pasteImport', text });
}

function search() {
  const q = document.getElementById('searchInput').value.trim();
  vscode.postMessage({ command: 'search', query: q });
}

function askLLM() {
  const problem = document.getElementById('problemInput').value.trim();
  const report  = document.getElementById('reportInput').value.trim();
  const mode    = document.getElementById('modeSelect').value;
  if (!problem) return;
  vscode.postMessage({ command: 'askLLM', problem, report, mode });
}

window.addEventListener('message', e => {
  const msg = e.data;
  switch (msg.command) {
    case 'captureStatus': {
      const on = msg.enabled;
      document.getElementById('dot').className = 'status-dot ' + (on ? 'on' : 'off');
      document.getElementById('statusLabel').textContent = on ? 'On' : 'Off';
      break;
    }
    case 'extractResult': {
      const el = document.getElementById('extractResult');
      el.style.display = 'block';
      el.textContent = JSON.stringify(msg.result, null, 2);
      break;
    }
    case 'extractionDone': {
      showToast('✅ Extraction complete (' + msg.reason + ')');
      break;
    }
    case 'searchResults': {
      const el = document.getElementById('searchResults');
      el.style.display = 'block';
      el.textContent = msg.results.length
        ? msg.results.map(r => '#' + r.id + ' — ' + r.problem_summary).join('\\n')
        : 'No results';
      break;
    }
    case 'llmResponse': {
      const el = document.getElementById('llmResult');
      el.style.display = 'block';
      el.textContent = msg.result.response || '(No response)';
      break;
    }
    case 'toast': {
      showToast(msg.text);
      break;
    }
  }
});

function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}
</script>
</body>
</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.VIEW_ID = "mistakememo.sidebarView";
//# sourceMappingURL=SidebarProvider.js.map