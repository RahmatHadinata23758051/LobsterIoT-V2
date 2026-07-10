import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RotateCcw, LogOut, AlertCircle, ChevronDown,
  LayoutDashboard, Settings, Clock, CheckCircle, AlertTriangle,
  Cpu, WifiOff, Wrench, Calendar,
  Anchor, Video, User, Layers, Droplet, UserRound
} from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { FeedingLogTab } from './components/feeding/FeedingLogTab';
import { SystemActivityTab } from './components/feeding/SystemActivityTab';
import { DeviceTab } from './components/devices/DeviceTab';
import { SystemSettings } from './components/settings/SystemSettings';
import { AccountProfile } from './components/settings/AccountProfile';
import { CageManagement } from './components/master/CageManagement';
import { CameraManagement } from './components/master/CameraManagement';
import { OperatorManagement } from './components/master/OperatorManagement';
import { GatewayManagement } from './components/master/GatewayManagement';
import { NodeManagement } from './components/master/NodeManagement';
import { SensorTypeManagement } from './components/master/SensorTypeManagement';
import { api } from './api/api';

const SENSOR_MAP = [
  { key: 'ph',                label: 'pH Air',     unit: 'ph',   code: 'ph' },
  { key: 'tds',               label: 'TDS',        unit: 'ppm',  code: 'tds' },
  { key: 'dissolved_oxygen',  label: 'DO',         unit: 'mg/L', code: 'dissolved_oxygen' },
  { key: 'water_temperature', label: 'Suhu',       unit: '°C',   code: 'water_temperature' },
  { key: 'flow_rate',         label: 'Arus',       unit: 'm/s',  code: 'flow_rate' },
  { key: 'turbidity',         label: 'Turbidity',  unit: 'NTU',  code: 'turbidity' },
];

const PATH_TO_TAB = {
  '/dashboard': 'dashboard',
  '/log-pakan': 'feeding',
  '/log-aktivitas': 'activity_logs',
  '/data-master/edge-computing': 'edge_computing',
  '/data-master/iot-node': 'iot_node',
  '/data-master/sensor': 'sensor',
  '/data-master/keramba': 'cages',
  '/data-master/kamera': 'cameras',
  '/data-master/petugas': 'operators',
  '/kelola-perangkat': 'devices',
  '/pengaturan': 'settings',
  '/profil': 'profile',
};

function getPathFromTab(tab) {
  if (tab === 'dashboard') return '/dashboard';
  if (tab === 'feeding') return '/log-pakan';
  if (tab === 'activity_logs') return '/log-aktivitas';
  if (tab === 'edge_computing') return '/data-master/edge-computing';
  if (tab === 'iot_node') return '/data-master/iot-node';
  if (tab === 'sensor') return '/data-master/sensor';
  if (tab === 'cages') return '/data-master/keramba';
  if (tab === 'cameras') return '/data-master/kamera';
  if (tab === 'operators') return '/data-master/petugas';
  if (tab === 'devices') return '/kelola-perangkat';
  if (tab === 'settings') return '/pengaturan';
  if (tab === 'profile') return '/profil';
  return '/dashboard';
}

export default function App() {
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

  const [logoText, setLogoText] = useState(() => localStorage.getItem('slam_logo_text') || 'SLAM 2.0');
  const [instansiName, setInstansiName] = useState(() => localStorage.getItem('slam_instansi_name') || 'Balai Akuakultur Nusantara');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States
  const [nodes, setNodes] = useState([]);
  const [activeNodeSerial, setActiveNodeSerial] = useState('');
  const [dashboardData, setDashboardData] = useState({ latest: null, series_24h: [], thresholds: [] });
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

  const logActivity = (action) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('id-ID'),
      action: action
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 10);
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

  // Sync state with URL location
  useEffect(() => {
    const matched = PATH_TO_TAB[location.pathname];
    if (matched) {
      setActiveTab(matched);
    } else if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname]);

  // Sync URL with Tab changes
  useEffect(() => {
    if (!token) return;
    const targetPath = getPathFromTab(activeTab);
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: false });
    }
  }, [activeTab, token]);

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
      if (r.ok && data.status === 'success') setWeatherData(data.data);
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
    setLoadingThresholds(true);
    try {
      const r = await api.fetchThresholds(token);
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
      } else {
        alert(data.message || 'Gagal mendaftarkan IoT Node.');
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
      } else {
        alert(data.message || 'Gagal menyimpan KJA.');
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
    setLoadingThresholds(true);
    try {
      const r = await api.updateThresholds(token, formattedList);
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

  const handleValidateSerial = async (serialNumber) => {
    setLoadingValidation(true);
    setValidationResult(null);
    try {
      const r = await api.validateDeviceSerial(token, serialNumber);
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
      const r = await api.activateDevice(token, {
        serial_number: activationData.serial_number,
        city_id: parseInt(activationData.city_id),
        latitude: activationData.latitude ? parseFloat(activationData.latitude) : null,
        longitude: activationData.longitude ? parseFloat(activationData.longitude) : null
      });
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('IoT Node berhasil diaktifkan.');
        logActivity(`Mengaktifkan IoT Node serial: ${activationData.serial_number}`);
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
      const r = await api.submitMaintenance(token, maintData);
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        alert('Laporan pemeliharaan berhasil dikirim.');
        logActivity(`Mengirim laporan pemeliharaan unit: ${maintData.iot_node_serial_number}`);
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

  const activeNode = nodes.find(n => n.serial_number === activeNodeSerial);

  // Authentication gate
  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  // Sidebar Navigation Groups — AgriSense-style flat layout
  const navGroups = [
    {
      title: 'OPERASIONAL',
      items: [
        { id: 'dashboard',     label: 'Dasbor Utama',      icon: LayoutDashboard },
        { id: 'feeding',       label: 'Log Pakan',          icon: Calendar },
        { id: 'activity_logs', label: 'Log Aktivitas',      icon: Clock },
      ]
    },
    {
      title: 'MANAJEMEN DATA',
      items: [
        { id: 'cages',         label: 'Keramba (KJA)',      icon: Anchor },
        { id: 'cameras',       label: 'Kamera CCTV',        icon: Video },
        { id: 'operators',     label: 'Petugas Lapangan',   icon: User },
      ]
    },
    {
      title: 'KONFIGURASI & IoT',
      items: [
        { id: 'edge_computing',label: 'Edge Gateway',       icon: Layers },
        { id: 'iot_node',      label: 'IoT Node',           icon: Cpu },
        { id: 'sensor',        label: 'Sensor & Batas',     icon: Droplet },
        { id: 'devices',       label: 'Kelola Perangkat',   icon: Wrench },
      ]
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'profile',       label: 'Profil Akun',        icon: UserRound },
        { id: 'settings',      label: 'Pengaturan Sistem',  icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 flex" id="app-root">
      
      {/* ═ LEFT SIDEBAR ════════════════════════════════════════════════ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen z-40">
        
        {/* Brand Header */}
        <div className="px-5 h-[60px] border-b border-slate-200 flex items-center gap-3 shrink-0 select-none">
          <img
            src="/Icon.png"
            alt="SLAM Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-md flex-shrink-0"
          />
          <div>
            <p className="text-[14px] font-bold leading-none text-slate-900 tracking-tight">{logoText}</p>
            <p className="text-[10px] text-[#0D9D1B] font-bold leading-none mt-0.5 uppercase tracking-widest">Lobster Monitoring</p>
          </div>
        </div>

        {/* Grouped Sidebar Menu Items */}
        <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto scrollbar-none">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 cursor-pointer select-none
                      ${activeTab === id
                        ? 'bg-[#0D9D1B] text-white shadow-sm shadow-green-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <Icon className="h-[15px] w-[15px] shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-650 hover:bg-red-50 transition cursor-pointer select-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar Sistem</span>
          </button>
        </div>

      </aside>

      {/* ═ RIGHT CONTENT WRAPPER ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-[56px] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
          
          {/* Left: Combined Clock + Weather + Status */}
          <div className="flex items-center gap-3">
            {/* Clock + Weather combined widget */}
            <div className="flex items-center gap-2 text-[12px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg select-none">
              <Clock className="h-3.5 w-3.5 text-[#0D9D1B] shrink-0" />
              <span className="font-bold text-slate-800 font-mono tabular-nums">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {weatherData && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-[#0D9D1B]">{weatherData.temperature_c}°C</span>
                  <span className="capitalize text-slate-500">{weatherData.condition}</span>
                </>
              )}
            </div>

            {/* Connection Error Banner inline */}
            {connError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-200 animate-pulse">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Koneksi Terputus</span>
              </div>
            )}

            {/* Overall Status Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border select-none
              ${overallStatus === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200'
               : overallStatus === 'offline' ? 'bg-slate-50 text-slate-500 border-slate-200'
               : 'bg-[#f0fdf4] text-[#15803D] border-[#bbf7d0]'}`}>
              {overallStatus === 'warning'
                ? <AlertTriangle className="h-3.5 w-3.5" />
                : overallStatus === 'offline'
                ? <WifiOff className="h-3.5 w-3.5" />
                : <CheckCircle className="h-3.5 w-3.5" />}
              <span>{overallStatus === 'warning' ? 'Peringatan' : overallStatus === 'offline' ? 'Offline' : 'Normal'}</span>
            </div>
          </div>

          {/* Right: Active Node Select & Clock & Operator profile info */}
          <div className="flex items-center gap-4">
            
            {/* Active Node Dropdown */}
            {nodes.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setNodeDropdownOpen(!nodeDropdownOpen)}
                  className="flex items-center gap-2 h-8 px-3 border border-slate-250 rounded-lg text-[12px] font-medium text-slate-750 bg-white hover:bg-slate-50 transition cursor-pointer select-none">
                  <span className={`h-2 w-2 rounded-full ${activeNode ? 'bg-[#0D9D1B] animate-pulse' : 'bg-slate-300'}`} />
                  <span className="max-w-[145px] truncate font-mono font-bold text-slate-800">{activeNodeSerial || 'Pilih Node'}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${nodeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {nodeDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-[fadeIn_0.15s_ease-out]">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">Daftar Node Aktif</p>
                    {loadingNodes
                      ? <div className="py-6 text-center text-xs text-slate-400">Memuat...</div>
                      : nodes.map(node => (
                        <button key={node.id}
                          onClick={() => { setActiveNodeSerial(node.serial_number); setNodeDropdownOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${node.serial_number === activeNodeSerial ? 'text-[#0D9D1B] font-semibold' : 'text-slate-700'}`}>
                          <Cpu className={`h-4 w-4 shrink-0 ${node.serial_number === activeNodeSerial ? 'text-[#0D9D1B]' : 'text-slate-400'}`} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold font-mono truncate">{node.serial_number}</p>
                            <p className="text-[10px] text-slate-400">{node.city?.name || 'Lokasi tidak diketahui'}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Refresh Action */}
            <button onClick={() => activeNodeSerial && fetchDashboardData(activeNodeSerial)}
              disabled={loadingDashboard || !activeNodeSerial}
              title="Segarkan data telemetri"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-750 hover:bg-slate-50 transition cursor-pointer disabled:opacity-30">
              <RotateCcw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin text-[#0D9D1B]' : ''}`} />
            </button>

            {/* User Profile display */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 h-6">
              <div className="text-right select-none">
                <p className="text-[11px] font-semibold text-slate-900 leading-none">{user?.name || 'Operator'}</p>
                <p className="text-[9px] text-slate-400 font-bold capitalize leading-none mt-0.5">{user?.role || '—'}</p>
              </div>
            </div>

          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-6 py-6 max-w-screen-2xl w-full mx-auto flex flex-col gap-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              activeNode={activeNode}
              activeNodeSerial={activeNodeSerial}
              dashboardData={dashboardData}
              cameras={cameras}
              chartMetric={chartMetric}
              setChartMetric={setChartMetric}
            />
          )}

          {activeTab === 'feeding' && (
            <FeedingLogTab
              cagesList={cagesList}
              operatorsList={operatorsList}
              feedingLogs={feedingLogs}
              loadingFeeding={loadingFeeding}
              onAddFeedingLog={handleAddFeedingLog}
              onDeleteFeedingLog={handleDeleteFeedingLog}
              onRefresh={fetchFeedingLogs}
            />
          )}

          {activeTab === 'activity_logs' && (
            <SystemActivityTab
              activityLogs={activityLogs}
            />
          )}



          {/* ── Manajemen Data: individual flattened pages ── */}
          {activeTab === 'cages' && (
            <CageManagement
              cagesList={cagesList}
              loadingCages={loadingCages}
              onAddCage={handleAddCage}
              onDeleteCage={handleDeleteCage}
              onRefresh={fetchCages}
            />
          )}

          {activeTab === 'cameras' && (
            <CameraManagement
              camerasList={camerasList}
              loadingCameras={loadingCameras}
              onAddCamera={handleAddCamera}
              onDeleteCamera={handleDeleteCamera}
              onRefresh={fetchCamerasList}
            />
          )}

          {activeTab === 'operators' && (
            <OperatorManagement
              operatorsList={operatorsList}
              loadingOperators={loadingOperators}
              onAddOperator={handleAddOperator}
              onDeleteOperator={handleDeleteOperator}
              onRefresh={fetchOperators}
            />
          )}

          {activeTab === 'edge_computing' && (
            <GatewayManagement
              edgeGatewaysList={edgeGatewaysList}
              loadingEdgeGateways={loadingEdgeGateways}
              onAddEdgeGateway={handleAddEdgeGateway}
              onDeleteEdgeGateway={handleDeleteEdgeGateway}
              onRefresh={fetchEdgeGateways}
            />
          )}

          {activeTab === 'iot_node' && (
            <NodeManagement
              iotNodesMasterList={iotNodesMasterList}
              loadingIotNodesMaster={loadingIotNodesMaster}
              citiesList={citiesList}
              edgeGatewaysList={edgeGatewaysList}
              onAddIotNodeMaster={handleAddIotNodeMaster}
              onDeleteIotNodeMaster={handleDeleteIotNodeMaster}
              onRefresh={fetchIotNodesMaster}
            />
          )}

          {activeTab === 'sensor' && (
            <SensorTypeManagement
              sensorTypesList={sensorTypesList}
              loadingSensorTypes={loadingSensorTypes}
              thresholdsList={thresholdsList}
              loadingThresholds={loadingThresholds}
              onRefresh={fetchSensorTypes}
              onUpdateThresholds={handleUpdateThresholds}
              setThresholdsList={setThresholdsList}
            />
          )}

          {activeTab === 'devices' && (
            <DeviceTab
              citiesList={citiesList}
              maintenancesList={maintenancesList}
              loadingMaintenances={loadingMaintenances}
              loadingValidation={loadingValidation}
              loadingActivation={loadingActivation}
              loadingMaintenance={loadingMaintenance}
              validationResult={validationResult}
              onValidateSerial={handleValidateSerial}
              onActivateNode={handleActivateNode}
              onSubmitMaintenance={handleSubmitMaintenance}
              onRefreshMaintenances={fetchMaintenances}
            />
          )}

          {activeTab === 'profile' && (
            <AccountProfile
              user={user}
              profileMessage={profileMessage}
              onUpdateProfile={handleUpdateProfile}
              logActivity={logActivity}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettings
              user={user}
              logoText={logoText}
              setLogoText={setLogoText}
              instansiName={instansiName}
              setInstansiName={setInstansiName}
              logActivity={logActivity}
            />
          )}
        </main>

        {/* App Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-400 select-none shrink-0" id="main-footer">
          {logoText} — Sistem Layanan Akuakultur Monitoring &copy; 2026 &nbsp;·&nbsp; {instansiName}
        </footer>
      </div>
    </div>
  );
}
