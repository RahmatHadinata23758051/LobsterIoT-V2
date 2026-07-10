import useSimulator from './hooks/useSimulator';
import { 
  formatTime, 
  formatDuration, 
  formatSimulatedTime 
} from './utils/simulationMath';
import { 
  Play, 
  Square, 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Compass, 
  RotateCw, 
  Terminal, 
  Lock, 
  Globe, 
  Clock, 
  Layers 
} from 'lucide-react';

function App() {
  const {
    apiUrl,
    setApiUrl,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authToken,
    isApiConnecting,
    apiError,
    nodes,
    selectedNode,
    cages,
    selectedCage,
    
    mqttHost,
    setMqttHost,
    mqttPort,
    setMqttPort,
    isConnected,
    isConnecting,
    connectMqtt,
    disconnectMqtt,
    
    clockMode,
    setClockMode,
    simulatedTime,
    
    isRunning,
    runMode,
    setRunMode,
    durationHours,
    setDurationHours,
    intervalSeconds,
    setIntervalSeconds,
    timeLeft,
    timeRemainingSeconds,
    totalSimulationSeconds,
    
    liveMetrics,
    activeAnomaly,
    logs,
    setLogs,
    
    handleApiLogin,
    handleNodeSelect,
    handleCageSelect,
    startSimulation,
    stopSimulation,
    triggerAnomaly
  } = useSimulator();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      {/* Top Header Cockpit Panel */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 glow-cyan">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider text-white uppercase flex items-center gap-2">
                Lobsense V2.0 <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold tracking-widest">CONSOLE</span>
              </h1>
              <p className="text-[10px] tracking-wide text-slate-500 uppercase font-mono-tech">Soft Telemetry Emulation Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* API Connection Indicator */}
            <div className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono-tech font-bold border transition ' + (
              authToken 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            )}>
              <Globe size={12} className={authToken ? "animate-spin" : ""} />
              API: {authToken ? 'SYNCED' : 'UNSYNCED'}
            </div>

            {/* MQTT Broker Status */}
            <div className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono-tech font-bold border transition ' + (
              isConnected 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : isConnecting 
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-400 animate-pulse'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
            )}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              MQTT: {isConnected ? 'ONLINE' : isConnecting ? 'CONNECTING...' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </header>

      {/* Control Room Cockpit Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Command & Configuration Cockpit (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card 1: Backend Database Synchronization */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
              <Layers size={14} className="text-cyan-400" /> Database Registry Sync
            </h2>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Backend API Endpoint</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  disabled={authToken}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                />
              </div>

              {!authToken ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] text-emerald-400 flex items-center justify-between">
                  <span>Logged in as: <strong>{authEmail}</strong></span>
                  <button 
                    onClick={() => { setLogs([]); }}
                    className="text-[9px] font-bold underline hover:text-white uppercase transition"
                  >
                    Logout
                  </button>
                </div>
              )}

              {apiError && <p className="text-[10px] text-rose-400 font-medium">{apiError}</p>}

              {!authToken && (
                <button
                  onClick={handleApiLogin}
                  disabled={isApiConnecting}
                  className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400 transition rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={12} /> {isApiConnecting ? 'Connecting...' : 'Sync Registered Data'}
                </button>
              )}
            </div>

            {/* Dropdown selectors for Node and Cage */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Registered Node</label>
                <select 
                  value={selectedNode.serial_number}
                  onChange={(e) => handleNodeSelect(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-cyan-500"
                >
                  {nodes.map(node => (
                    <option key={node.serial_number} value={node.serial_number}>
                      {node.serial_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Cage Code Map</label>
                <select 
                  value={selectedCage.cage_code}
                  onChange={(e) => handleCageSelect(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-cyan-500"
                >
                  {cages.map(cage => (
                    <option key={cage.cage_code} value={cage.cage_code}>
                      {cage.cage_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Coordinate display read-only */}
            <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono-tech text-slate-400 flex justify-between">
              <span>LAT: {parseFloat(selectedNode.latitude ?? -8.6529).toFixed(6)}</span>
              <span>LON: {parseFloat(selectedNode.longitude ?? 116.3195).toFixed(6)}</span>
            </div>
          </div>

          {/* Card 2: MQTT Broker Connection */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
              <Database size={14} className="text-cyan-400" /> MQTT Broker Settings
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Host IP</label>
                <input 
                  type="text" 
                  value={mqttHost}
                  onChange={(e) => setMqttHost(e.target.value)}
                  disabled={isConnected}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">WS Port</label>
                <input 
                  type="text" 
                  value={mqttPort}
                  onChange={(e) => setMqttPort(e.target.value)}
                  disabled={isConnected}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-tech text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {!isConnected ? (
                <button
                  onClick={connectMqtt}
                  disabled={isConnecting}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-98 transition text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50 glow-cyan"
                >
                  <Wifi size={12} /> Connect Broker
                </button>
              ) : (
                <button
                  onClick={disconnectMqtt}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 transition text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <WifiOff size={12} /> Disconnect Broker
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Emulation Control */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
              <Clock size={14} className="text-cyan-400" /> Emulation Control
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Clock Mode Toggle */}
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Clock Mode</label>
                <select 
                  value={clockMode}
                  onChange={(e) => setClockMode(e.target.value)}
                  disabled={isRunning}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="fast">Demo Cepat (Fast)</option>
                  <option value="real">Waktu Riil (Real)</option>
                </select>
              </div>

              {/* simulatedTime display */}
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Simulated Clock</label>
                <div className="mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-tech text-cyan-400 font-bold flex items-center justify-center h-8">
                  {clockMode === 'real' ? 'COMPUTER CLOCK' : formatSimulatedTime(simulatedTime)}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3 flex flex-col gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Transmission Interval</label>
                <select
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                  disabled={isRunning}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value={2}>2 Seconds (Debugging)</option>
                  <option value={5}>5 Seconds (Default Demo)</option>
                  <option value={10}>10 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Execution Limit Mode</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    onClick={() => setRunMode('nonstop')}
                    disabled={isRunning}
                    className={'py-1.5 px-3 rounded-lg text-xs font-bold transition border disabled:opacity-50 ' + (
                      runMode === 'nonstop'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Realtime Nonstop
                  </button>
                  <button
                    onClick={() => setRunMode('timed')}
                    disabled={isRunning}
                    className={'py-1.5 px-3 rounded-lg text-xs font-bold transition border disabled:opacity-50 ' + (
                      runMode === 'timed'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Batas Waktu (Timed)
                  </button>
                </div>
              </div>

              {runMode === 'timed' && (
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Select Duration</label>
                  <select 
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                    disabled={isRunning}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    <option value={0.0833}>5 Minutes (Test)</option>
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours</option>
                  </select>
                </div>
              )}
            </div>

            {/* Execution status readouts */}
            {isRunning && (
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">NEXT TRANSMISSION:</span>
                  <span className="font-mono text-cyan-300 font-bold animate-pulse">{formatTime(timeLeft)}</span>
                </div>
                {runMode === 'timed' && (
                  <div className="flex flex-col gap-1 border-t border-slate-900 pt-2 mt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold">REMAINING RUN TIME:</span>
                      <span className="font-mono text-white font-bold">{formatDuration(timeRemainingSeconds)}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-cyan-400 h-full transition-all duration-1000"
                        style={{ width: ((timeRemainingSeconds / totalSimulationSeconds) * 100) + '%' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 border-t border-slate-900 pt-3">
              {!isRunning ? (
                <button
                  onClick={startSimulation}
                  disabled={!isConnected}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 active:scale-98 transition text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-30 glow-cyan"
                >
                  <Play size={14} fill="currentColor" /> Start Emulation
                </button>
              ) : (
                <button
                  onClick={stopSimulation}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 transition text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 glow-alert"
                >
                  <Square size={14} fill="currentColor" /> Stop Emulation
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Live Telemetry Cockpit (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Card 1: Dials Grid (6 parameters) */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
              <Activity size={14} className="text-cyan-400" /> Active Telemetry Monitor
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* PH Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Potential Hydrogen</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white glow-text">
                    {liveMetrics.ph.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">pH</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">STATUS:</span>
                  <span className={'font-bold ' + (activeAnomaly === 'ph' ? 'text-rose-400' : 'text-emerald-400')}>
                    {activeAnomaly === 'ph' ? 'ANOMALY' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* DO Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Dissolved Oxygen</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white">
                    {liveMetrics.doValue.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">mg/L</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">STATUS:</span>
                  <span className={'font-bold ' + (activeAnomaly === 'do' ? 'text-rose-400' : 'text-emerald-400')}>
                    {activeAnomaly === 'do' ? 'HYPOXIA' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Water Temperature Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Water Temp</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white">
                    {liveMetrics.waterTemp.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">°C</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">STATUS:</span>
                  <span className="text-emerald-400 font-bold">STABLE</span>
                </div>
              </div>

              {/* TDS Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Solids</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white">
                    {liveMetrics.tds}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">ppm</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">STATUS:</span>
                  <span className={'font-bold ' + (activeAnomaly === 'tds' ? 'text-rose-400' : 'text-emerald-400')}>
                    {activeAnomaly === 'tds' ? 'WARNING' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Turbidity Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Turbidity</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white">
                    {liveMetrics.turbidity.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">NTU</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">STATUS:</span>
                  <span className={'font-bold ' + (activeAnomaly === 'turbidity' ? 'text-rose-400' : 'text-emerald-400')}>
                    {activeAnomaly === 'turbidity' ? 'MUDDY' : 'CLEAR'}
                  </span>
                </div>
              </div>

              {/* Flow Rate Dial */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between h-24">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Water Flow</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold font-mono-tech text-white">
                    {liveMetrics.flowRate.toFixed(3)}
                  </span>
                  <span className="text-[9px] font-mono-tech text-slate-500">L/min</span>
                </div>
                <div className="flex items-center justify-between text-[9px] border-t border-slate-900/60 pt-1 mt-2">
                  <span className="text-slate-600 font-bold">PUMP:</span>
                  <span className={'font-bold ' + (liveMetrics.flowRate > 0.05 ? 'text-emerald-400' : 'text-rose-400')}>
                    {liveMetrics.flowRate > 0.05 ? 'ACTIVE' : 'FAILURE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Panel: Gyroscope Status Readouts */}
            <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl grid grid-cols-3 gap-2 text-[10px] font-mono-tech text-slate-400">
              <div className="text-center border-r border-slate-900">PITCH: {liveMetrics.pitch.toFixed(2)}°</div>
              <div className="text-center border-r border-slate-900">ROLL: {liveMetrics.roll.toFixed(2)}°</div>
              <div className="text-center">YAW: {liveMetrics.yaw.toFixed(1)}°</div>
            </div>

            {/* Trigger Anomaly Controllers */}
            <div className="border-t border-slate-900 pt-3">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-amber-500" /> Inject Telemetry Anomalies (Gradual Shift & Recovery)
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <button
                  onClick={() => triggerAnomaly('ph')}
                  className={'py-1.5 px-2 rounded-lg text-[10px] font-bold transition border ' + (
                    activeAnomaly === 'ph'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 glow-alert'
                      : 'bg-slate-950 border-slate-900 hover:border-rose-500/40 text-slate-400 hover:text-rose-400'
                  )}
                >
                  Acid pH (5.2)
                </button>
                <button
                  onClick={() => triggerAnomaly('tds')}
                  className={'py-1.5 px-2 rounded-lg text-[10px] font-bold transition border ' + (
                    activeAnomaly === 'tds'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 glow-alert'
                      : 'bg-slate-950 border-slate-900 hover:border-rose-500/40 text-slate-400 hover:text-rose-400'
                  )}
                >
                  High TDS (680)
                </button>
                <button
                  onClick={() => triggerAnomaly('do')}
                  className={'py-1.5 px-2 rounded-lg text-[10px] font-bold transition border ' + (
                    activeAnomaly === 'do'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 glow-alert'
                      : 'bg-slate-950 border-slate-900 hover:border-rose-500/40 text-slate-400 hover:text-rose-400'
                  )}
                >
                  Hypoxia DO (2.8)
                </button>
                <button
                  onClick={() => triggerAnomaly('turbidity')}
                  className={'py-1.5 px-2 rounded-lg text-[10px] font-bold transition border ' + (
                    activeAnomaly === 'turbidity'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 glow-alert'
                      : 'bg-slate-950 border-slate-900 hover:border-rose-500/40 text-slate-400 hover:text-rose-400'
                  )}
                >
                  Muddy (110)
                </button>
                <button
                  onClick={() => triggerAnomaly('flow')}
                  className={'py-1.5 px-2 rounded-lg text-[10px] font-bold transition border ' + (
                    activeAnomaly === 'flow'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 glow-alert'
                      : 'bg-slate-950 border-slate-900 hover:border-rose-500/40 text-slate-400 hover:text-rose-400'
                  )}
                >
                  No Flow (0.0)
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Terminal Transmission Logger */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" /> Live Data Stream
              </h2>
              <button 
                onClick={() => setLogs([])}
                className="text-[9px] tracking-wider uppercase font-bold text-slate-500 hover:text-cyan-400 transition"
              >
                Clear Stream
              </button>
            </div>

            <div className="h-64 overflow-y-auto font-mono-tech text-[10px] flex flex-col gap-2 pr-2 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-slate-700 italic py-16 text-center flex flex-col items-center justify-center gap-1.5">
                  <Terminal size={20} className="opacity-30" />
                  Console Idle. Start Emulation to stream data packets.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-bold">[{log.timestamp}]</span>
                        <span className={'px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ' + (
                          log.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                          log.type === 'publish' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/30' :
                          log.type === 'warn' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                          log.type === 'error' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' :
                          'bg-slate-900 text-slate-500'
                        )}>{log.type}</span>
                        <span className="text-slate-400 font-medium">{log.message}</span>
                      </div>
                    </div>
                    {log.details && (
                      <pre className="text-slate-500 bg-slate-950 p-2 rounded border border-slate-900/60 overflow-x-auto text-[9px] leading-relaxed max-h-36 scrollbar-none">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
