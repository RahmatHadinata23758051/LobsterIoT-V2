export const feedingApi = (BACKEND_URL, getHeaders) => ({
  async fetchFeedingLogs(token) {
    return fetch(`${BACKEND_URL}/api/v2/feeding-logs`, {
      headers: getHeaders(token),
    });
  },

  async addFeedingLog(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/feeding-logs`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteFeedingLog(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/feeding-logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },
});
