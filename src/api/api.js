const BACKEND_URL = 'http://localhost:8000';

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

export const api = {
  // Auth API
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

  // Weather API
  async fetchWeather(token) {
    return fetch(`${BACKEND_URL}/api/v2/weather/latest`, {
      headers: getHeaders(token),
    });
  },

  // Monitoring IoT Nodes List
  async fetchNodes(token) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes`, {
      headers: getHeaders(token),
    });
  },

  // Dashboard Data for selected IoT Node
  async fetchDashboardData(token, serial) {
    return fetch(`${BACKEND_URL}/api/v2/monitoring/dashboard/${serial}`, {
      headers: getHeaders(token),
    });
  },

  // Feeding Logs API
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

  // Sensor Thresholds Configuration API
  async fetchThresholds(token) {
    return fetch(`${BACKEND_URL}/api/v2/thresholds`, {
      headers: getHeaders(token),
    });
  },

  async updateThresholds(token, thresholds) {
    return fetch(`${BACKEND_URL}/api/v2/thresholds/bulk-update`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ thresholds }),
    });
  },

  // Device Operations API (Validation, Activation, Maintenance)
  async validateDeviceSerial(token, serialNumber) {
    return fetch(`${BACKEND_URL}/api/v2/devices/validate-serial`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ serial_number: serialNumber }),
    });
  },

  async activateDevice(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/devices/activate`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async fetchMaintenances(token) {
    return fetch(`${BACKEND_URL}/api/v2/maintenances`, {
      headers: getHeaders(token),
    });
  },

  async submitMaintenance(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/maintenances`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  // Profile Settings API
  async updateProfile(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/operators/profile`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  // Cities List Lookup API
  async fetchCities(token) {
    return fetch(`${BACKEND_URL}/api/v2/cities`, {
      headers: getHeaders(token),
    });
  },

  // Edge Gateways CRUD API
  async fetchEdgeGateways(token) {
    return fetch(`${BACKEND_URL}/api/v2/edge-gateways`, {
      headers: getHeaders(token),
    });
  },

  async addEdgeGateway(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/edge-gateways`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteEdgeGateway(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/edge-gateways/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },

  // IoT Nodes Master CRUD API
  async fetchIotNodesMaster(token) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes-master`, {
      headers: getHeaders(token),
    });
  },

  async addIotNodeMaster(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes-master`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteIotNodeMaster(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes-master/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },

  // Sensor Types Lookup API
  async fetchSensorTypes(token) {
    return fetch(`${BACKEND_URL}/api/v2/sensor-types`, {
      headers: getHeaders(token),
    });
  },

  // Cages CRUD API
  async fetchCages(token) {
    return fetch(`${BACKEND_URL}/api/v2/cages`, {
      headers: getHeaders(token),
    });
  },

  async addCage(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/cages`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteCage(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/cages/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },

  // Cameras CRUD API
  async fetchCameras(token) {
    return fetch(`${BACKEND_URL}/api/v2/cameras`, {
      headers: getHeaders(token),
    });
  },

  async addCamera(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/cameras`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteCamera(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/cameras/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },

  // Operators CRUD API
  async fetchOperators(token) {
    return fetch(`${BACKEND_URL}/api/v2/operators`, {
      headers: getHeaders(token),
    });
  },

  async addOperator(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/operators`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  async deleteOperator(token, id) {
    return fetch(`${BACKEND_URL}/api/v2/operators/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
  },
};
