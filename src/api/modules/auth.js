export const authApi = (BACKEND_URL, getHeaders) => ({
  async login(email, password) {
    const r = await fetch(`${BACKEND_URL}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return r;
  },

  async logout(token) {
    return fetch(`${BACKEND_URL}/api/v2/auth/logout`, {
      method: 'POST',
      headers: getHeaders(token),
    });
  },

  async updateProfile(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/profile`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },
});
