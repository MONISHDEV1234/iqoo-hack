/**
 * apiClient.ts — Thin HTTP client for the backend API.
 * All extension→backend calls go through here.
 * BASE_URL is configurable via VS Code settings.
 */

import * as vscode from "vscode";

function getBaseUrl(): string {
  const cfg = vscode.workspace.getConfiguration("mistakememo");
  return cfg.get<string>("backendUrl", "http://localhost:8000");
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`[MistakeMemo] POST ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v) { url.searchParams.set(k, v); } });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`[MistakeMemo] GET ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export class ApiClient {
  async extract(body: { events?: unknown[]; raw_text?: string; project?: string; workspace?: string }): Promise<unknown> {
    return post("/session/extract", body);
  }

  async askLLM(body: { problem_text: string; report_text?: string; mode: string }): Promise<unknown> {
    return post("/llm/ask", body);
  }

  async listExperiences(params?: { scope?: string; category?: string; q?: string }): Promise<unknown[]> {
    const p: Record<string, string> = {};
    if (params?.scope) { p["scope"] = params.scope; }
    if (params?.category) { p["category"] = params.category; }
    if (params?.q) { p["q"] = params.q; }
    return get<unknown[]>("/experiences", p);
  }

  async createExperience(body: unknown): Promise<{ id: number }> {
    return post<{ id: number }>("/experiences", body);
  }

  async retrieve(body: { problem_text: string; scope?: string[] }): Promise<unknown> {
    return post("/retrieve", body);
  }

  async report(body: { experience_ids: number[] }): Promise<unknown> {
    return post("/report", body);
  }
}
