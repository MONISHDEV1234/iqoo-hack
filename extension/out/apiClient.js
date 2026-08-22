"use strict";
/**
 * apiClient.ts — Thin HTTP client for the backend API.
 * All extension→backend calls go through here.
 * BASE_URL is configurable via VS Code settings.
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
exports.ApiClient = void 0;
const vscode = __importStar(require("vscode"));
function getBaseUrl() {
    const cfg = vscode.workspace.getConfiguration("mistakememo");
    return cfg.get("backendUrl", "https://devcresthack.onrender.com");
}
async function post(path, body) {
    const res = await fetch(`${getBaseUrl()}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`[MistakeMemo] POST ${path} → ${res.status}`);
    }
    return res.json();
}
async function get(path, params) {
    const url = new URL(`${getBaseUrl()}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v) {
            url.searchParams.set(k, v);
        } });
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`[MistakeMemo] GET ${path} → ${res.status}`);
    }
    return res.json();
}
class ApiClient {
    async extract(body) {
        return post("/session/extract", body);
    }
    async askLLM(body) {
        return post("/llm/ask", body);
    }
    async listExperiences(params) {
        const p = {};
        if (params?.scope) {
            p["scope"] = params.scope;
        }
        if (params?.category) {
            p["category"] = params.category;
        }
        if (params?.q) {
            p["q"] = params.q;
        }
        return get("/experiences", p);
    }
    async createExperience(body) {
        return post("/experiences", body);
    }
    async retrieve(body) {
        return post("/retrieve", body);
    }
    async report(body) {
        return post("/report", body);
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=apiClient.js.map