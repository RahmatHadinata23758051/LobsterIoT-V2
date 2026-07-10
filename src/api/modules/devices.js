export const devicesApi = (BACKEND_URL, getHeaders) => ({
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
});
