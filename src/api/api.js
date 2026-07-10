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
  async fetchThresholds(token, serial) {
    return fetch(`${BACKEND_URL}/api/v2/thresholds?iot_node_serial_number=${encodeURIComponent(serial)}`, {
      headers: getHeaders(token),
    });
  },

  async updateThresholds(token, serial, thresholds) {
    return fetch(`${BACKEND_URL}/api/v2/thresholds/bulk-update`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ iot_node_serial_number: serial, thresholds }),
    });
  },

  // Device Operations API (Validation, Activation, Maintenance)
  async validateDeviceSerial(token, category, serialNumber) {
    return fetch(`${BACKEND_URL}/api/v2/devices/validate-serial`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ category, serial_number: serialNumber }),
    });
  },

  async activateDevice(token, formData) {
    return fetch(`${BACKEND_URL}/api/v2/devices/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });
  },

  async fetchMaintenances(token) {
    return fetch(`${BACKEND_URL}/api/v2/maintenances`, {
      headers: getHeaders(token),
    });
  },

  async submitMaintenance(token, formData) {
    return fetch(`${BACKEND_URL}/api/v2/maintenances`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });
  },

  // Profile Settings API
  async updateProfile(token, data) {
    return fetch(`${BACKEND_URL}/api/v2/profile`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
  },

  // System Settings API
  async fetchSystemSettings(token) {
    return fetch(`${BACKEND_URL}/api/v2/system-settings`, {
      headers: getHeaders(token),
    });
  },

  async updateSystemSettings(token, settings) {
    return fetch(`${BACKEND_URL}/api/v2/system-settings`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(settings),
    });
  },

  // Regional API
  async fetchProvinces(token) {
    return fetch(`${BACKEND_URL}/api/v2/provinces`, {
      headers: getHeaders(token),
    });
  },

  async fetchCities(token, provinceCode = '') {
    const url = provinceCode 
      ? `${BACKEND_URL}/api/v2/cities?province_code=${provinceCode}`
      : `${BACKEND_URL}/api/v2/cities`;
    return fetch(url, {
      headers: getHeaders(token),
    });
  },

  async fetchDistricts(token, cityCode) {
    return fetch(`${BACKEND_URL}/api/v2/districts?city_code=${cityCode}`, {
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
