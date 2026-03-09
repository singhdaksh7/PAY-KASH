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

  // Auth
  login(email, pin) {
    return this.request("/auth/login", { method: "POST", body: JSON.stringify({ email, pin }) });
  }
  signup(name, email, pin) {
    return this.request("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, pin }) });
  }
  getMe() {
    return this.request("/auth/me");
  }
  updateProfile(data) {
    return this.request("/auth/profile", { method: "PUT", body: JSON.stringify(data) });
  }

  // Transactions
  send(toUserId, amount, note) {
    return this.request("/transactions/send", { method: "POST", body: JSON.stringify({ toUserId, amount, note }) });
  }
  getHistory(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/transactions/history?${qs}`);
  }
  getStats() {
    return this.request("/transactions/stats");
  }
  getReceipt(id) {
    return this.request(`/transactions/receipt?id=${id}`);
  }

  // Requests
  createRequest(toUserId, amount, note) {
    return this.request("/transactions/requests", { method: "POST", body: JSON.stringify({ toUserId, amount, note }) });
  }
  getRequests() {
    return this.request("/transactions/requests");
  }
  respondRequest(requestId, action) {
    return this.request("/transactions/requests", { method: "PUT", body: JSON.stringify({ requestId, action }) });
  }

  // Users
  getUsers(search = "") {
    return this.request(`/users?search=${encodeURIComponent(search)}`);
  }
  getQrData() {
    return this.request("/users/qr");
  }

  // Notifications
  getNotifications() {
    return this.request("/notifications");
  }
  markNotificationsRead(notificationId, markAll = false) {
    return this.request("/notifications", { method: "PUT", body: JSON.stringify({ notificationId, markAll }) });
  }

  // Admin
  getAdminDashboard() {
    return this.request("/admin/dashboard");
  }
  creditUser(userId, amount, note) {
    return this.request("/admin/credit", { method: "POST", body: JSON.stringify({ userId, amount, note }) });
  }
  getAdminTransactions(page = 1) {
    return this.request(`/admin/transactions?page=${page}`);
  }
}

export const api = new ApiClient();
export default api;
