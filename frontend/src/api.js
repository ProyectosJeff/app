const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
async function request(p, o = {}) {
  const h = o.headers || {};
  if (!h["Content-Type"] && !(o.body instanceof FormData))
    h["Content-Type"] = "application/json";
  const t = localStorage.getItem("token");
  if (t) h["Authorization"] = "Bearer " + t;
  const r = await fetch(API + p, { ...o, headers: h });
  if (!r.ok) throw new Error((await r.json()).error || "Error");
  return r.json();
}
export const api = {
  login: (u, p) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: u, password: p }),
    }),
  findByCode: (c) => request("/api?code=" + encodeURIComponent(c)),
  submitCount: (id, conteo) =>
    request("/api/" + id + "/count", {
      method: "PUT",
      body: JSON.stringify({ conteo }),
    }),
  progress: () => request("/api/reports/progress"),
  statusSummary: () => request("/api/reports/status-summary"),
  listPublic: () => fetch(API + "/api/items").then((r) => r.json()),
};
