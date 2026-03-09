const API_BASE = "/api";

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("cc_token") || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem("cc_token", token);
    else localStorage.removeItem("cc_token");
  }

  getToken() {
    return this.token || localStorage.getItem("cc_token");
  }

  async request(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        this.setToken(null);
        window.location.reload();
      }
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  // ─── Auth ──────────────────────────────
  login(email, pin) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, pin }),
    });
  }

  signup(name, email, pin) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, pin }),
    });
  }

  getMe() {
    return this.request("/auth/me");
  }

  // ─── Transactions ─────────────────────
  send(toUserId, amount, note) {
    return this.request("/transactions/send", {
      method: "POST",
      body: JSON.stringify({ toUserId, amount, note }),
    });
  }

  getHistory(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/transactions/history?${qs}`);
  }

  getStats() {
    return this.request("/transactions/stats");
  }

  // ─── Users ────────────────────────────
  getUsers(search = "") {
    return this.request(`/users?search=${encodeURIComponent(search)}`);
  }

  // ─── Admin ────────────────────────────
  getAdminDashboard() {
    return this.request("/admin/dashboard");
  }

  creditUser(userId, amount, note) {
    return this.request("/admin/credit", {
      method: "POST",
      body: JSON.stringify({ userId, amount, note }),
    });
  }

  getAdminTransactions(page = 1) {
    return this.request(`/admin/transactions?page=${page}`);
  }
}

export const api = new ApiClient();
export default api;
