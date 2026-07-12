export const telemetryApi = (BACKEND_URL, getHeaders) => ({
  async fetchWeather(token) {
    return fetch(`${BACKEND_URL}/api/v2/weather/latest`, {
      headers: getHeaders(token),
    });
  },

  async fetchNodes(token) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes`, {
      headers: getHeaders(token),
    });
  },

  async fetchDashboardData(token, serial) {
    return fetch(`${BACKEND_URL}/api/v2/monitoring/dashboard/${serial}`, {
      headers: getHeaders(token),
    });
  },

  async detect(token, base64Image) {
    return fetch(`${BACKEND_URL}/api/v2/detect`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ image: base64Image }),
    });
  },
});
