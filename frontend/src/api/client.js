const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? "http://localhost:8000" : "https://iqoo-hack.onrender.com");

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  getDashboardStats() {
    return request("/dashboard/stats");
  },

  listExperiences({ scope, category, q, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (scope) params.append("scope", scope);
    if (category) params.append("category", category);
    if (q) params.append("q", q);
    params.append("limit", limit.toString());
    return request(`/experiences?${params.toString()}`);
  },

  getExperience(id) {
    return request(`/experiences/${id}`);
  },

  createExperience(data) {
    return request("/experiences", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  extractSession({ events, raw_text, project, workspace }) {
    return request("/session/extract", {
      method: "POST",
      body: JSON.stringify({ events, raw_text, project, workspace }),
    });
  },

  retrieve({ problem_text, scope }) {
    return request("/retrieve", {
      method: "POST",
      body: JSON.stringify({ problem_text, scope }),
    });
  },

  generateReport({ experience_ids, current_problem, ranked_results }) {
    return request("/report", {
      method: "POST",
      body: JSON.stringify({ experience_ids, current_problem, ranked_results }),
    });
  },

  askLLM({ problem_text, report_text, mode }) {
    return request("/llm/ask", {
      method: "POST",
      body: JSON.stringify({ problem_text, report_text, mode }),
    });
  },

  sendCoachMessage(message) {
    return request("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  getRecurringPatterns() {
    return request("/chat/patterns");
  },
};
