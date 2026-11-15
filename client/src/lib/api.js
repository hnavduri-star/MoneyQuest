/** First-party API only. No third-party requests are ever made. */
async function call(method, path, { token, body, headers = {} } = {}) {
  // The standalone preview page has no server: everything stays on this device.
  if (import.meta.env.VITE_STATIC === '1') throw Object.assign(new Error('offline'), { status: 0 });
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
export const api = {
  createFamily: (pin) => call('POST', '/families', { body: { pin } }),
  joinFamily: (code, pin) => call('POST', '/families/join', { body: { code, pin } }),
  getFamily: (token) => call('GET', '/family', { token }),
  putProfile: (token, p) => call('PUT', `/profiles/${p.id}`, { token, body: p }),
  deleteProfile: (token, id, pin) => call('DELETE', `/profiles/${id}`, { token, headers: { 'x-parent-pin': pin } }),
  leaderboard: (token) => call('GET', '/leaderboard', { token }),
  createClass: (name, pin) => call('POST', '/classes', { body: { name, pin } }),
  loginClass: (code, pin) => call('POST', '/classes/login', { body: { code, pin } }),
  classInfo: (code) => call('GET', `/classes/${encodeURIComponent(code)}/info`),
  classReport: (code, token) => call('GET', `/classes/${encodeURIComponent(code)}`, { token }),
};
