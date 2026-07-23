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

  async toggleAerator(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/mobile/aerator/toggle`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async triggerInstantFeeding(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/mobile/feeding/trigger`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async addFeedingSchedule(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/mobile/feeding/schedule`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async fetchFeedingControlData(token, serialNumber = 'DEMO-NODE-001') {
    return fetch(`${BACKEND_URL}/api/v2/mobile/feeding/schedules?serial_number=${serialNumber}`, {
      headers: getHeaders(token),
    });
  },
});
