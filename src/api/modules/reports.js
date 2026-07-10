export const reportsApi = (BACKEND_URL, getHeaders) => ({
  // Reports & Exports Download API
  async downloadReport(token, type, format, filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${BACKEND_URL}/api/v2/reports/${type}/${format}${query}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Gagal mengunduh file laporan.');
    }
    return response.blob();
  },

  async getReportData(token, type, filters = {}) {
    const params = new URLSearchParams({ type });
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await fetch(`${BACKEND_URL}/api/v2/reports?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Gagal memuat data laporan.');
    }
    const res = await response.json();
    return res.data || [];
  },
});
