import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/api';

const SENSOR_MAP = [
  { key: 'ph',                label: 'pH Air',     unit: 'ph',   code: 'ph' },
  { key: 'tds',               label: 'TDS',        unit: 'ppm',  code: 'tds' },
  { key: 'dissolved_oxygen',  label: 'DO',         unit: 'mg/L', code: 'dissolved_oxygen' },
  { key: 'water_temperature', label: 'Suhu',       unit: '°C',   code: 'water_temperature' },
  { key: 'flow_rate',         label: 'Arus',       unit: 'm/s',  code: 'flow_rate' },
  { key: 'turbidity',         label: 'Turbidity',  unit: 'NTU',  code: 'turbidity' },
];

export const useLobsense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [token, setToken] = useState(localStorage.getItem('lobsense_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lobsense_user'));
    } catch {
      return null;
    }
  });

  const [logoText, setLogoText] = useState(() => localStorage.getItem('slam_logo_text') || 'LOBSENSE 1.0');
  const [instansiName, setInstansiName] = useState(() => localStorage.getItem('slam_instansi_name') || 'Balai Akuakultur Nusantara');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('lobsense_logo_url') || null);

  // Fetch System Settings on startup to sync Logo URL & Branding
  useEffect(() => {
    if (!token) return;
    const loadSystemSettings = async () => {
      try {
        const r = await api.fetchSystemSettings(token);
        const data = await r.json();
        if (r.ok && data.status === 'success' && data.data) {
          if (data.data.system_logo_text) {
            setLogoText(data.data.system_logo_text);
            localStorage.setItem('slam_logo_text', data.data.system_logo_text);
          }
          if (data.data.system_instansi_name) {
            setInstansiName(data.data.system_instansi_name);
            localStorage.setItem('slam_instansi_name', data.data.system_instansi_name);
          }
          if (data.data.system_logo_url) {
            setLogoUrl(data.data.system_logo_url);
            localStorage.setItem('lobsense_logo_url', data.data.system_logo_url);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSystemSettings();
  }, [token]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States
  const [nodes, setNodes] = useState([]);
  const [activeNodeSerial, setActiveNodeSerial] = useState('');
  const [dashboardData, setDashboardData] = useState({ latest: null, series_24h: [], thresholds: [], cameras: [], feeding_logs: [] });
  const [cameras, setCameras] = useState([]);
  const [chartMetric, setChartMetric] = useState('ph');
  
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [connError, setConnError] = useState('');
  const [weatherData, setWeatherData] = useState(null);

  // Feeding logs & maintenance logs
  const [feedingLogs, setFeedingLogs] = useState([]);
  const [loadingFeeding, setLoadingFeeding] = useState(false);
  const [maintenancesList, setMaintenancesList] = useState([]);
  const [loadingMaintenances, setLoadingMaintenances] = useState(false);

  // Thresholds state
  const [thresholdsList, setThresholdsList] = useState([]);
  const [loadingThresholds, setLoadingThresholds] = useState(false);

  // Device validations & activations
  const [validationResult, setValidationResult] = useState(null);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [loadingActivation, setLoadingActivation] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  // Profile message
  const [profileMessage, setProfileMessage] = useState('');

  // Master lists
  const [edgeGatewaysList, setEdgeGatewaysList] = useState([]);
  const [loadingEdgeGateways, setLoadingEdgeGateways] = useState(false);
  const [iotNodesMasterList, setIotNodesMasterList] = useState([]);
  const [loadingIotNodesMaster, setLoadingIotNodesMaster] = useState(false);
  const [sensorTypesList, setSensorTypesList] = useState([]);
  const [loadingSensorTypes, setLoadingSensorTypes] = useState(false);
  const [cagesList, setCagesList] = useState([]);
  const [loadingCages, setLoadingCages] = useState(false);
  const [camerasList, setCamerasList] = useState([]);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [operatorsList, setOperatorsList] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [citiesList, setCitiesList] = useState([]);

  // Local storage audit activities
  const [activityLogs, setActivityLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lobsense_activities') || '[]');
    } catch {
      return [];
    }
  });

  const logActivity = (action, actorName = null, actorRole = null) => {
    const now = new Date();
    const formattedTime = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: Date.now(),
      time: formattedTime,
      formattedTime: formattedTime,
      userName: actorName || user?.name || 'Sistem / Operator',
      role: actorRole || user?.role || 'operator',
      action: action
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('lobsense_activities', JSON.stringify(updated));
      return updated;
    });
  };

  // Time ticker
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Dropdown closer
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNodeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Fetch initial telemetry lists
  useEffect(() => {
    if (token) {
      fetchNodesAndCameras();
      fetchWeather();
    }
  }, [token]);

  // Fetch dashboard telemetry on node change
  useEffect(() => {
    if (token && activeNodeSerial) {
      fetchDashboardData(activeNodeSerial);
      const iv = setInterval(() => fetchDashboardData(activeNodeSerial, true), 10000);
      return () => clearInterval(iv);
    }
  }, [token, activeNodeSerial]);

  // Fetch feature-specific lists when tabs change
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'feeding') {
      fetchFeedingLogs();
      fetchCages();
      fetchOperators();
    }
    if (['cages','cameras','operators','edge_computing','iot_node','sensor'].includes(activeTab)) {
      fetchMasterData();
    }
    if (activeTab === 'devices') {
      fetchCities();
      fetchMaintenances();
    }
  }, [activeTab, token]);

  // API Call wrappers
  const handleLoginSuccess = (t, u) => {
    setToken(t);
    setUser(u);
    setConnError('');
    logActivity('Login berhasil ke sistem monitoring');
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout(token);
    } catch {}
    localStorage.removeItem('lobsense_token');
    localStorage.removeItem('lobsense_user');
    setToken(null);
    setUser(null);
    setNodes([]);
    setActiveNodeSerial('');
    setDashboardData({ latest: null, series_24h: [], thresholds: [] });
  };

  const fetchNodesAndCameras = async () => {
    setLoadingNodes(true);
    setConnError('');
    try {
      const [nr, cr] = await Promise.all([
        api.fetchNodes(token),
        api.fetchCameras(token),
      ]);
      const nd = await nr.json();
      const cd = await cr.json();
      if (nr.ok && nd.status === 'success') {
        const list = nd.data || [];
        setNodes(list);
        if (list.length > 0) setActiveNodeSerial(list[0].serial_number);
      } else {
        setConnError('Gagal memuat daftar perangkat.');
      }
      if (cr.ok && cd.status === 'success') {
        setCameras(cd.data || []);
      }
    } catch {
      setConnError('Gagal menghubungi server backend di localhost:8000.');
    } finally {
      setLoadingNodes(false);
    }
  };

  const fetchWeather = async () => {
    try {
      const r = await api.fetchWeather(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        const reports = data.data;
        if (Array.isArray(reports) && reports.length > 0) {
          const systemReport = reports.find(w => w.city_code === 'SYSTEM' || w.province_code === 'SYSTEM');
          const report = systemReport || reports[0];
          setWeatherData({
            temperature_c: report.temperature ? Math.round(parseFloat(report.temperature)) : 28,
            condition: report.weather_description || 'Cerah',
            humidity: report.humidity || '--',
            wind_speed: report.wind_speed || '--',
            rainfall: report.rainfall || '0',
            icon_url: report.icon_url,
            city_name: report.city_name || 'Lombok'
          });
        } else if (reports && !Array.isArray(reports)) {
          setWeatherData({
            temperature_c: reports.temperature ? Math.round(parseFloat(reports.temperature)) : 28,
            condition: reports.weather_description || 'Cerah',
            humidity: reports.humidity || '--',
            wind_speed: reports.wind_speed || '--',
            rainfall: reports.rainfall || '0',
            icon_url: reports.icon_url,
            city_name: reports.city_name || 'Lombok'
          });
        } else {
          setWeatherData(null);
        }
      }
    } catch {}
  };

  const fetchFeedingLogs = async () => {
    setLoadingFeeding(true);
    try {
      const r = await api.fetchFeedingLogs(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setFeedingLogs(data.data || []);
    } catch {} finally {
      setLoadingFeeding(false);
    }
  };

  const fetchThresholds = async () => {
    if (!activeNodeSerial) return;
    setLoadingThresholds(true);
    try {
      const r = await api.fetchThresholds(token, activeNodeSerial);
      const data = await r.json();
      if (r.ok && data.status === 'success') setThresholdsList(data.data || []);
    } catch {} finally {
      setLoadingThresholds(false);
    }
  };

  const fetchDashboardData = async (serial, silent = false) => {
    if (!silent) setLoadingDashboard(true);
    try {
      const r = await api.fetchDashboardData(token, serial);
      const result = await r.json();
      if (r.ok && result.status === 'success') {
        setDashboardData({
          latest: result.data.latest || null,
          series_24h: result.data.series_24h || [],
          thresholds: result.data.thresholds || [],
          cameras: result.data.cameras || [],
          feeding_logs: result.data.feeding_logs || [],
        });

      }
    } catch {} finally {
      if (!silent) setLoadingDashboard(false);
    }
  };

  const fetchMasterData = () => {
    fetchCages();
    fetchCamerasList();
    fetchOperators();
    fetchEdgeGateways();
    fetchIotNodesMaster();
    fetchSensorTypes();
    fetchCities();
    fetchThresholds();
  };

  const fetchEdgeGateways = async () => {
    setLoadingEdgeGateways(true);
    try {
      const r = await api.fetchEdgeGateways(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setEdgeGatewaysList(data.data || []);
    } catch {} finally {
      setLoadingEdgeGateways(false);
    }
  };

  const fetchIotNodesMaster = async () => {
    setLoadingIotNodesMaster(true);
    try {
      const r = await api.fetchIotNodesMaster(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setIotNodesMasterList(data.data || []);
    } catch {} finally {
      setLoadingIotNodesMaster(false);
    }
  };

  const fetchSensorTypes = async () => {
    setLoadingSensorTypes(true);
    try {
      const r = await api.fetchSensorTypes(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setSensorTypesList(data.data || []);
    } catch {} finally {
      setLoadingSensorTypes(false);
    }
  };

  const fetchCages = async () => {
    setLoadingCages(true);
    try {
      const r = await api.fetchCages(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setCagesList(data.data || []);
    } catch {} finally {
      setLoadingCages(false);
    }
  };

  const fetchCamerasList = async () => {
    setLoadingCameras(true);
    try {
      const r = await api.fetchCameras(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setCamerasList(data.data || []);
    } catch {} finally {
      setLoadingCameras(false);
    }
  };

  const fetchOperators = async () => {
    setLoadingOperators(true);
    try {
      const r = await api.fetchOperators(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setOperatorsList(data.data || []);
    } catch {} finally {
      setLoadingOperators(false);
    }
  };

  const fetchCities = async () => {
    try {
      const r = await api.fetchCities(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setCitiesList(data.data || []);
    } catch {}
  };

  const fetchMaintenances = async () => {
    setLoadingMaintenances(true);
    try {
      const r = await api.fetchMaintenances(token);
      const data = await r.json();
      if (r.ok && data.status === 'success') setMaintenancesList(data.data || []);
    } catch {} finally {
      setLoadingMaintenances(false);
    }
  };

  // Form submission and CRUD actions
  const handleAddEdgeGateway = async (gatewayData) => {
    try {
      const r = await api.addEdgeGateway(token, gatewayData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Edge Gateway baru berhasil didaftarkan.');
        fetchEdgeGateways();
        logActivity(`Mendaftarkan Edge Gateway baru: ${data.data.serial_number}`);
      } else {
        alert(data.message || 'Gagal mendaftarkan Edge Gateway.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleUpdateEdgeGateway = async (id, gatewayData) => {
    try {
      const r = await api.updateEdgeGateway(token, id, gatewayData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Edge Gateway berhasil diperbarui.');
        fetchEdgeGateways();
        logActivity(`Memperbarui Edge Gateway ID: ${id}`);
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal memperbarui Edge Gateway.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleDeleteEdgeGateway = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Edge Gateway ini?')) return;
    try {
      const r = await api.deleteEdgeGateway(token, id);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Edge Gateway berhasil dihapus.');
        fetchEdgeGateways();
        logActivity('Menghapus data Edge Gateway');
      } else {
        alert(data.message || 'Gagal menghapus Edge Gateway.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleAddIotNodeMaster = async (nodeData) => {
    try {
      const r = await api.addIotNodeMaster(token, nodeData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('IoT Node baru berhasil didaftarkan.');
        fetchIotNodesMaster();
        logActivity(`Mendaftarkan IoT Node baru: ${data.data.serial_number}`);
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal mendaftarkan IoT Node.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleUpdateIotNodeMaster = async (id, nodeData) => {
    try {
      const r = await api.updateIotNodeMaster(token, id, nodeData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('IoT Node berhasil diperbarui.');
        fetchIotNodesMaster();
        logActivity(`Memperbarui IoT Node ID: ${id}`);
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal memperbarui IoT Node.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleDeleteIotNodeMaster = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus IoT Node ini?')) return;
    try {
      const r = await api.deleteIotNodeMaster(token, id);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('IoT Node berhasil dihapus.');
        fetchIotNodesMaster();
        logActivity('Menghapus data IoT Node');
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal menghapus IoT Node.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleAddCage = async (cageData) => {
    try {
      const r = await api.addCage(token, cageData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Data KJA baru berhasil didaftarkan.');
        logActivity(`Mendaftarkan KJA baru: ${cageData.cage_code}`);
        fetchCages();
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal menyimpan KJA.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleUpdateCage = async (id, cageData) => {
    try {
      const r = await api.updateCage(token, id, cageData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Data KJA berhasil diperbarui.');
        logActivity(`Memperbarui KJA ID: ${id}`);
        fetchCages();
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal memperbarui KJA.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleDeleteCage = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data KJA ini?')) return;
    try {
      const r = await api.deleteCage(token, id);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('KJA berhasil dihapus.');
        logActivity('Menghapus data keramba KJA');
        fetchCages();
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Gagal menghapus KJA.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleAddCamera = async (cameraData) => {
    try {
      const r = await api.addCamera(token, cameraData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Kamera baru berhasil terdaftar.');
        logActivity(`Mendaftarkan kamera CCTV baru: ${cameraData.camera_code}`);
        fetchCamerasList();
      } else {
        alert(data.message || 'Gagal mendaftarkan kamera.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleDeleteCamera = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kamera ini?')) return;
    try {
      const r = await api.deleteCamera(token, id);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Kamera berhasil dihapus.');
        logActivity('Menghapus kamera CCTV');
        fetchCamerasList();
      } else {
        alert(data.message || 'Gagal menghapus kamera.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleUpdateCamera = async (id, cameraData) => {
    try {
      const r = await api.updateCamera(token, id, cameraData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Data kamera berhasil diperbarui.');
        logActivity(`Memperbarui kamera CCTV: ${cameraData.camera_code}`);
        fetchCamerasList();
      } else {
        alert(data.message || 'Gagal memperbarui kamera.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleAddOperator = async (opData) => {
    try {
      const r = await api.addOperator(token, opData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Operator baru berhasil ditambahkan.');
        logActivity(`Menambahkan operator lapangan baru: ${opData.full_name}`);
        fetchOperators();
      } else {
        alert(data.message || 'Gagal menyimpan operator.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleDeleteOperator = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus operator ini?')) return;
    try {
      const r = await api.deleteOperator(token, id);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Operator berhasil dihapus.');
        logActivity('Menghapus data operator lapangan');
        fetchOperators();
      } else {
        alert(data.message || 'Gagal menghapus operator.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    }
  };

  const handleAddFeedingLog = async (feedData) => {
    try {
      const r = await api.addFeedingLog(token, feedData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        fetchFeedingLogs();
        logActivity('Mencatat data pemberian pakan lobster');
        alert('Log pemberian pakan berhasil disimpan.');
      } else {
        alert(data.message || 'Gagal menyimpan log pakan.');
      }
    } catch {
      alert('Koneksi ke backend gagal.');
    }
  };

  const handleDeleteFeedingLog = async (id) => {
    if (!window.confirm('Hapus data log pakan ini?')) return;
    try {
      const r = await api.deleteFeedingLog(token, id);
      if (r.ok) {
        fetchFeedingLogs();
        logActivity('Menghapus data log pemberian pakan');
      } else {
        const d = await r.json();
        alert(d.message || 'Gagal menghapus log pakan.');
      }
    } catch {
      alert('Koneksi ke backend gagal.');
    }
  };

  const handleUpdateThresholds = async (formattedList) => {
    if (!activeNodeSerial) {
      alert('Tidak ada IoT Node aktif terpilih.');
      return;
    }
    setLoadingThresholds(true);
    try {
      const r = await api.updateThresholds(token, activeNodeSerial, formattedList);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        logActivity('Memperbarui konfigurasi ambang batas sensor');
        alert('Konfigurasi batas sensor berhasil diperbarui secara massal.');
        if (activeNodeSerial) fetchDashboardData(activeNodeSerial);
      } else {
        alert(data.message || 'Gagal memperbarui thresholds.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    } finally {
      setLoadingThresholds(false);
    }
  };

  const handleValidateSerial = async (category, serialNumber) => {
    setLoadingValidation(true);
    setValidationResult(null);
    try {
      const r = await api.validateDeviceSerial(token, category, serialNumber);
      const data = await r.json();
      setValidationResult(data);
    } catch {
      setValidationResult({ status: 'error', message: 'Koneksi backend terputus.' });
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleActivateNode = async (activationData) => {
    setLoadingActivation(true);
    try {
      const formData = new FormData();
      formData.append('category', activationData.category);
      formData.append('id', parseInt(activationData.id));
      formData.append('picture', activationData.picture);
      formData.append('signature', activationData.signature);
      formData.append('latitude', parseFloat(activationData.latitude));
      formData.append('longitude', parseFloat(activationData.longitude));

      const r = await api.activateDevice(token, formData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Perangkat berhasil diaktifkan.');
        logActivity(`Mengaktifkan perangkat serial: ${activationData.serial_number}`);
        fetchNodesAndCameras();
      } else {
        alert(data.message || 'Aktivasi gagal.');
      }
    } catch {
      alert('Koneksi ke backend gagal.');
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleSubmitMaintenance = async (maintData) => {
    setLoadingMaintenance(true);
    try {
      const formData = new FormData();
      formData.append('iot_node_id', parseInt(maintData.iot_node_id));
      formData.append('description', maintData.description);
      formData.append('signature', maintData.signature);
      formData.append('latitude', parseFloat(maintData.latitude));
      formData.append('longitude', parseFloat(maintData.longitude));
      if (maintData.picture) {
        formData.append('picture', maintData.picture);
      }

      const r = await api.submitMaintenance(token, formData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Laporan pemeliharaan berhasil dikirim.');
        logActivity(`Mengirim laporan pemeliharaan perangkat ID: ${maintData.iot_node_id}`);
        fetchMaintenances();
      } else {
        alert(data.message || 'Gagal mengirim laporan.');
      }
    } catch {
      alert('Koneksi backend bermasalah.');
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const handleUpdateProfile = async (payload) => {
    setProfileMessage('');
    try {
      const r = await api.updateProfile(token, payload);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        setProfileMessage('Profil Anda berhasil diperbarui.');
        logActivity('Memperbarui detail profil pengguna');
        localStorage.setItem('lobsense_user', JSON.stringify(data.data));
        setUser(data.data);
      } else {
        setProfileMessage(data.message || 'Gagal memperbarui profil.');
      }
    } catch {
      setProfileMessage('Koneksi backend bermasalah.');
    }
  };

  // Helper status utilities
  const getThreshold = (code) => {
    const t = dashboardData.thresholds.find((th) => th.sensor_code === code);
    return t ? { min: Number(t.value_min), max: Number(t.value_max) } : null;
  };

  const getLiveValue = (key) => {
    const v = dashboardData.latest?.[key];
    return (v !== undefined && v !== null) ? Number(v) : null;
  };

  const getSensorStatus = (key, code) => {
    const val = getLiveValue(key);
    const th = getThreshold(code);
    if (val === null) return 'offline';
    if (!th) return 'normal';
    return (val < th.min || val > th.max) ? 'warning' : 'normal';
  };

  const overallStatus = (() => {
    if (!dashboardData.latest) return 'offline';
    const anyWarning = SENSOR_MAP.some(s => getSensorStatus(s.key, s.code) === 'warning');
    return anyWarning ? 'warning' : 'normal';
  })();

  return {
    token, setToken,
    user, setUser,
    logoText, setLogoText,
    instansiName, setInstansiName,
    logoUrl, setLogoUrl,
    activeTab, setActiveTab,
    currentTime,
    nodeDropdownOpen, setNodeDropdownOpen, dropdownRef,
    nodes, setNodes,
    activeNodeSerial, setActiveNodeSerial,
    dashboardData, setDashboardData,
    cameras, setCameras,
    chartMetric, setChartMetric,
    loadingNodes, setLoadingNodes,
    loadingDashboard, setLoadingDashboard,
    connError, setConnError,
    weatherData, setWeatherData,
    feedingLogs, setFeedingLogs,
    loadingFeeding, setLoadingFeeding,
    maintenancesList, setMaintenancesList,
    loadingMaintenances, setLoadingMaintenances,
    thresholdsList, setThresholdsList,
    loadingThresholds, setLoadingThresholds,
    validationResult, setValidationResult,
    loadingValidation, setLoadingValidation,
    loadingActivation, setLoadingActivation,
    loadingMaintenance, setLoadingMaintenance,
    profileMessage, setProfileMessage,
    edgeGatewaysList, setEdgeGatewaysList,
    loadingEdgeGateways, setLoadingEdgeGateways,
    iotNodesMasterList, setIotNodesMasterList,
    loadingIotNodesMaster, setLoadingIotNodesMaster,
    sensorTypesList, setSensorTypesList,
    loadingSensorTypes, setLoadingSensorTypes,
    cagesList, setCagesList,
    loadingCages, setLoadingCages,
    camerasList, setCamerasList,
    loadingCameras, setLoadingCameras,
    operatorsList, setOperatorsList,
    loadingOperators, setLoadingOperators,
    citiesList,
    activityLogs, setActivityLogs,
    logActivity,
    handleLoginSuccess, handleLogout,
    fetchNodesAndCameras, fetchWeather,
    fetchFeedingLogs, fetchThresholds, fetchDashboardData, fetchMasterData,
    fetchEdgeGateways, fetchIotNodesMaster, fetchSensorTypes, fetchCages,
    fetchCamerasList, fetchOperators, fetchCities, fetchMaintenances,
    handleAddEdgeGateway, handleUpdateEdgeGateway, handleDeleteEdgeGateway,
    handleAddIotNodeMaster, handleUpdateIotNodeMaster, handleDeleteIotNodeMaster,
    handleAddCage, handleUpdateCage, handleDeleteCage,
    handleAddCamera, handleUpdateCamera, handleDeleteCamera,
    handleAddOperator, handleDeleteOperator,
    handleAddFeedingLog, handleDeleteFeedingLog,
    handleUpdateThresholds, handleValidateSerial, handleActivateNode,
    handleSubmitMaintenance, handleUpdateProfile,
    getSensorStatus, overallStatus, api,
  };
};
