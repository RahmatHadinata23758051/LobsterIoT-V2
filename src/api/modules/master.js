export const masterApi = (BACKEND_URL, getHeaders) => ({
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

  async updateEdgeGateway(token, id, data) {
    return fetch(`${BACKEND_URL}/api/v2/edge-gateways/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
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

  async updateIotNodeMaster(token, id, data) {
    return fetch(`${BACKEND_URL}/api/v2/iot-nodes-master/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
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

  async updateCage(token, id, data) {
    return fetch(`${BACKEND_URL}/api/v2/cages/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
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

  async updateCamera(token, id, data) {
    return fetch(`${BACKEND_URL}/api/v2/cameras/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
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
});
