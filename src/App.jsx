import React from 'react';
import {
  RotateCcw, LogOut, AlertCircle, ChevronDown, ChevronRight,
  LayoutDashboard, Settings, Clock, CheckCircle, AlertTriangle,
  Cpu, WifiOff, Wrench, Calendar,
  Anchor, Video, User, Layers, Droplet, UserRound, FileDown
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
import { ReportsTab } from './components/reports/ReportsTab';
import { useLobsense } from './hooks/useLobsense';

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
  '/laporan-ekspor': 'reports',
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
  if (tab === 'reports') return '/laporan-ekspor';
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
  const {
    token, setToken,
    user, setUser,
    logoText, setLogoText,
    instansiName, setInstansiName,
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
  } = useLobsense();

  // Local dropdown states for Edge Gateway & cascading menu
  const [activeEdgeId, setActiveEdgeId] = React.useState('');
  const [hoveredEdgeId, setHoveredEdgeId] = React.useState(null);

  // Group nodes by Edge Gateway
  const edgeGateways = [];
  const edgeMap = new Map();

  nodes.forEach(node => {
    const gw = node.edge_gateway;
    const gwId = node.edge_gateway_id || gw?.id || 'unlinked';
    const gwSerial = gw?.serial_number || 'Tanpa Gateway';

    if (!edgeMap.has(gwId)) {
      edgeMap.set(gwId, {
        id: gwId,
        serial_number: gwSerial,
        nodes: []
      });
      edgeGateways.push(edgeMap.get(gwId));
    }
    edgeMap.get(gwId).nodes.push(node);
  });

  const activeNode = nodes.find(n => n.serial_number === activeNodeSerial);

  // Sync activeEdgeId with activeNode changes
  React.useEffect(() => {
    if (activeNode) {
      const gwId = activeNode.edge_gateway_id || activeNode.edge_gateway?.id || 'unlinked';
      if (gwId !== activeEdgeId) {
        setActiveEdgeId(gwId);
      }
    } else if (nodes.length > 0 && !activeEdgeId) {
      const firstNode = nodes[0];
      const gwId = firstNode.edge_gateway_id || firstNode.edge_gateway?.id || 'unlinked';
      setActiveEdgeId(gwId);
    }
  }, [activeNode, nodes]);

  const handleEdgeChange = (edgeId) => {
    setActiveEdgeId(edgeId);
    const targetEdge = edgeGateways.find(e => e.id === edgeId);
    if (targetEdge && targetEdge.nodes.length > 0) {
      setActiveNodeSerial(targetEdge.nodes[0].serial_number);
    }
  };

  const selectedEdge = edgeGateways.find(e => e.id === activeEdgeId);
  const filteredNodes = selectedEdge ? selectedEdge.nodes : [];

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
        { id: 'reports',       label: 'Laporan & Ekspor',   icon: FileDown },
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
    <div className="h-screen bg-[#f8fafc] font-sans text-slate-800 flex flex-col overflow-hidden" id="app-root">
      
      {/* ═ TOP HEADER (Full Width, edge-to-edge) ════════════════════════ */}
      <header className="bg-white border-b border-slate-200/80 h-[64px] px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0 select-none">
        
        {/* Left Side: Logo & Brand Name */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="/Icon.png"
            alt="LOBSENSE Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-sm flex-shrink-0"
          />
          <div>
            <p className="text-[14px] font-bold leading-none text-slate-900 tracking-tight">{logoText}</p>
            <p className="text-[9px] text-[#0D9D1B] font-semibold leading-none mt-1.5 uppercase tracking-widest">LOBSTER SENSING SYSTEM</p>
          </div>
        </div>

        {/* Right Side: Active Node Dropdown, Refresh, and User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Cascading Edge Gateway & IoT Node Dropdown */}
          {nodes.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setNodeDropdownOpen(!nodeDropdownOpen)}
                className="flex items-center gap-2 h-9 px-3 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-750 bg-white hover:bg-slate-50 transition cursor-pointer select-none">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[220px] truncate font-mono text-slate-800">
                  {edgeGateways.find(e => e.id === activeEdgeId)?.serial_number || 'Pilih Edge'}
                  <span className="text-slate-400 mx-1.5 font-sans">➔</span>
                  {activeNodeSerial || 'Pilih Node'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${nodeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {nodeDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-[fadeIn_0.15s_ease-out]">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-1.5 pb-1">Daftar Edge Gateway</p>
                  
                  {edgeGateways.map(edge => (
                    <div key={edge.id}
                      className="relative"
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}>
                      
                      <button
                        className={`w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${edge.id === activeEdgeId ? 'text-[#0D9D1B] font-semibold' : 'text-slate-705'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Layers className={`h-4 w-4 shrink-0 ${edge.id === activeEdgeId ? 'text-[#0D9D1B]' : 'text-slate-450'}`} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold font-mono truncate">{edge.serial_number}</p>
                            <p className="text-[10px] text-slate-400">{edge.nodes.length} IoT Node</p>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      {/* Sub-menu (Flyout) for IoT Nodes under this Edge Gateway */}
                      {hoveredEdgeId === edge.id && (
                        <div className="absolute right-full top-0 mr-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-[fadeIn_0.1s_ease-out]">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-1.5 pb-1 font-sans">
                            IoT Node ({edge.serial_number})
                          </p>
                          {edge.nodes.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400 font-sans">
                              Tidak ada IoT Node terhubung
                            </div>
                          ) : (
                            edge.nodes.map(node => (
                              <button key={node.id}
                                onClick={() => {
                                  setActiveNodeSerial(node.serial_number);
                                  setNodeDropdownOpen(false);
                                }}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${node.serial_number === activeNodeSerial ? 'text-[#0D9D1B] font-semibold' : 'text-slate-705'}`}>
                                <Cpu className={`h-4 w-4 shrink-0 ${node.serial_number === activeNodeSerial ? 'text-[#0D9D1B]' : 'text-slate-455'}`} />
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold font-mono truncate">{node.serial_number}</p>
                                  <p className="text-[10px] text-slate-400">{node.city?.name || 'Lokasi tidak diketahui'}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh Action */}
          <button onClick={() => activeNodeSerial && fetchDashboardData(activeNodeSerial)}
            disabled={loadingDashboard || !activeNodeSerial}
            title="Segarkan data telemetri"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-750 hover:bg-slate-50 transition cursor-pointer disabled:opacity-30">
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

      {/* ═ MAIN WORKSPACE CONTAINER (Below full-width top header) ══════ */}
      <div className="flex flex-1 h-[calc(100vh-64px)] min-h-0 overflow-hidden">
        
        {/* ═ LEFT SIDEBAR (Floating card with rounded-3xl) ═════════════ */}
        <aside className="w-64 bg-white border border-slate-200/80 rounded-3xl flex flex-col shrink-0 my-4 ml-6 mr-3 shadow-sm select-none overflow-hidden">
          
          {/* Jam & Tanggal Widget (Planted at the very top of sidebar) */}
          <div className="p-4 border-b border-slate-100/85 bg-slate-50/50 shrink-0">
            <div className="flex flex-col gap-1 bg-white p-3 rounded-2xl text-center select-none shadow-sm">
              <span className="font-extrabold text-slate-800 font-sans text-[20px] tracking-tight tabular-nums leading-none my-0.5">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans mt-1">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Grouped Sidebar Menu Items */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-none">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] font-bold transition-all duration-150 cursor-pointer select-none
                        ${activeTab === id
                          ? 'bg-[#0D9D1B] text-white shadow-sm shadow-green-500/20'
                          : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'}`}
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
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-bold text-red-650 hover:bg-red-50 transition cursor-pointer select-none"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Keluar Sistem</span>
            </button>
          </div>

        </aside>

        {/* ═ RIGHT CONTENT WRAPPER ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 my-4 mr-6 ml-3 overflow-hidden">
          


          {/* Main Content Area */}
          <main className="flex-1 px-3 py-4 max-w-screen-2xl w-full mx-auto flex flex-col gap-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              token={token}
              activeNode={activeNode}
              activeNodeSerial={activeNodeSerial}
              dashboardData={dashboardData}
              cameras={cameras}
              chartMetric={chartMetric}
              setChartMetric={setChartMetric}
              weatherData={weatherData}
              loadingDashboard={loadingDashboard}
            />
          )}

          {activeTab === 'feeding' && (
            <FeedingLogTab
              token={token}
              selectedSerial={activeNodeSerial}
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

          {activeTab === 'reports' && (
            <ReportsTab
              token={token}
              nodes={nodes}
              cagesList={cagesList}
            />
          )}



          {/* ── Manajemen Data: individual flattened pages ── */}
          {activeTab === 'cages' && (
            <CageManagement
              cagesList={cagesList}
              loadingCages={loadingCages}
              onAddCage={handleAddCage}
              onUpdateCage={handleUpdateCage}
              onDeleteCage={handleDeleteCage}
              onRefresh={fetchCages}
            />
          )}

          {activeTab === 'cameras' && (
            <CameraManagement
              camerasList={camerasList}
              iotNodesMasterList={iotNodesMasterList}
              loadingCameras={loadingCameras}
              onAddCamera={handleAddCamera}
              onUpdateCamera={handleUpdateCamera}
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
              citiesList={citiesList}
              loadingEdgeGateways={loadingEdgeGateways}
              onAddEdgeGateway={handleAddEdgeGateway}
              onUpdateEdgeGateway={handleUpdateEdgeGateway}
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
              onUpdateIotNodeMaster={handleUpdateIotNodeMaster}
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
              nodes={nodes}
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
              token={token}
              api={api}
            />
          )}
        </main>

        {/* App Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-400 select-none shrink-0" id="main-footer">
          {logoText} — LOBSTER SENSING SYSTEM &copy; 2026 &nbsp;·&nbsp; {instansiName}
        </footer>
      </div>
      </div>
    </div>
  );
}
