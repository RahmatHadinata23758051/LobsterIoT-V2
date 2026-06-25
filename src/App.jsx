import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
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
  Check, 
  Terminal 
} from 'lucide-react';

function App() {
  // MQTT Connection State
  const [mqttHost, setMqttHost] = useState('127.0.0.1');
  const [mqttPort, setMqttPort] = useState('9001'); // WebSockets port
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mqttClient, setMqttClient] = useState(null);

  // Device & Meta State
  const [serialNumber, setSerialNumber] = useState('NODE-99081');
  const [cageCode, setCageCode] = useState('CAGE-001');
  const [latitude, setLatitude] = useState(-7.693236);
  const [longitude, setLongitude] = useState(108.662284);

  // Sensor Baselines
  const [waterTemp, setWaterTemp] = useState(26.5);
  const [ambientTemp, setAmbientTemp] = useState(29.0);
  const [ph, setPh] = useState(7.3);
  const [tds, setTds] = useState(250);
  const [doValue, setDoValue] = useState(5.8);
  const [turbidity, setTurbidity] = useState(12.0);
  const [flowRate, setFlowRate] = useState(0.35);
  
  // Gyroscope Baselines
  const [pitch, setPitch] = useState(0.5);
  const [roll, setRoll] = useState(-1.0);
  const [yaw, setYaw] = useState(180.0);

  // Active Anomalies state
  const [activeAnomaly, setActiveAnomaly] = useState(null); // 'ph', 'tds', 'do', 'turbidity', 'flow'
  const [anomalyDuration, setAnomalyDuration] = useState(0); // number of transmissions left for anomaly

  // Simulator Running State
  const [isRunning, setIsRunning] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5); // Default 5 minutes
  const [timeLeft, setTimeLeft] = useState(300); // Countdown in seconds
  
  // Logger
  const [logs, setLogs] = useState([]);
  
  // Refs
  const clientRef = useRef(null);
  const timerRef = useRef(null);
  const publishIntervalRef = useRef(null);

  // Helper to append logs
  const logMessage = (type, message, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Date.now() + Math.random(), timestamp, type, message, details },
      ...prev.slice(0, 99) // limit to last 100 logs
    ]);
  };

  // Connect to MQTT Broker
  const connectMqtt = () => {
    if (clientRef.current) {
      clientRef.current.end();
    }

    setIsConnecting(true);
    logMessage('info', `Connecting to Mosquitto MQTT broker at ws://${mqttHost}:${mqttPort}...`);

    try {
      const client = mqtt.connect(`ws://${mqttHost}:${mqttPort}`, {
        keepalive: 60,
        clientId: 'lobsense_emulator_' + Math.random().toString(16).substring(2, 8),
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      client.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setMqttClient(client);
        logMessage('success', 'Connected to MQTT broker via WebSockets successfully!');
      });

      client.on('error', (err) => {
        setIsConnecting(false);
        logMessage('error', `Connection error: ${err.message}`);
      });

      client.on('close', () => {
        setIsConnected(false);
        setIsConnecting(false);
        logMessage('info', 'MQTT connection closed.');
      });

      clientRef.current = client;
    } catch (e) {
      setIsConnecting(false);
      logMessage('error', `Failed to initialize MQTT client: ${e.message}`);
    }
  };

  // Disconnect from MQTT Broker
  const disconnectMqtt = () => {
    if (clientRef.current) {
      clientRef.current.end();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsRunning(false);
    setMqttClient(null);
    logMessage('info', 'Disconnected from MQTT broker.');
  };

  // Generate & Publish Telemetry Payload
  const publishTelemetry = () => {
    if (!clientRef.current || !isConnected) {
      logMessage('warn', 'Failed to publish: MQTT client is not connected.');
      return;
    }

    // Apply minor random noise/jitter to simulate real electrical ADC reading fluctuations
    const getJitter = (range) => (Math.random() - 0.5) * range;

    let currentPh = ph + getJitter(0.04);
    let currentTds = tds + Math.round(getJitter(6));
    let currentWaterTemp = waterTemp + getJitter(0.15);
    let currentDo = doValue + getJitter(0.12);
    let currentTurbidity = turbidity + getJitter(0.8);
    let currentFlow = flowRate + getJitter(0.015);

    // Apply anomalies if active
    if (activeAnomaly && anomalyDuration > 0) {
      if (activeAnomaly === 'ph') {
        currentPh = 4.2; // Acidic drop
      } else if (activeAnomaly === 'tds') {
        currentTds = 850; // Extreme TDS
      } else if (activeAnomaly === 'do') {
        currentDo = 2.1; // Hypoxia DO
      } else if (activeAnomaly === 'turbidity') {
        currentTurbidity = 110; // Muddy water
      } else if (activeAnomaly === 'flow') {
        currentFlow = 0.0; // Pump failure
      }

      setAnomalyDuration(prev => {
        const next = prev - 1;
        if (next === 0) {
          setActiveAnomaly(null);
          logMessage('info', 'Anomaly duration ended. Restoring baseline parameters.');
        }
        return next;
      });
    }

    const payload = {
      serial_number: serialNumber,
      timestamp: Math.floor(Date.now() / 1000),
      cage_code: cageCode,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      raw_values: {
        temperature_node: parseFloat(currentWaterTemp.toFixed(2)),
        ambient_temperature: parseFloat((ambientTemp + getJitter(0.2)).toFixed(2)),
        ph: parseFloat(currentPh.toFixed(2)),
        tds: parseFloat(currentTds.toFixed(1)),
        raw_dissolved_oxygen: parseFloat(currentDo.toFixed(2)), // maps directly in calibration
        turbidity: parseFloat(currentTurbidity.toFixed(2)),
        salinity: 0.0,
        flow_rate: parseFloat(Math.max(0, currentFlow).toFixed(3)),
        pitch: parseFloat((pitch + getJitter(0.05)).toFixed(2)),
        roll: parseFloat((roll + getJitter(0.05)).toFixed(2)),
        yaw: parseFloat((yaw + getJitter(0.2)).toFixed(1)),
        pump_status: currentFlow > 0.05 ? 1 : 0
      }
    };

    const payloadString = JSON.stringify(payload, null, 2);
    
    try {
      clientRef.current.publish('lobsense/telemetry', JSON.stringify(payload));
      logMessage('publish', `Published telemetry packet to topic [lobsense/telemetry]`, payloadString);
    } catch (e) {
      logMessage('error', `Publish failed: ${e.message}`);
    }
  };

  // Start Simulation
  const startSimulation = () => {
    if (!isConnected) {
      logMessage('warn', 'Please connect to the MQTT broker first before starting the simulation.');
      return;
    }
    setIsRunning(true);
    setTimeLeft(intervalMinutes * 60);
    logMessage('success', `Simulation started! Telemetry will be sent every ${intervalMinutes} minute(s).`);
    // Publish immediately on start
    publishTelemetry();
  };

  // Stop Simulation
  const stopSimulation = () => {
    setIsRunning(false);
    logMessage('info', 'Simulation stopped.');
  };

  // Trigger Anomaly Helper
  const triggerAnomaly = (type) => {
    setActiveAnomaly(type);
    setAnomalyDuration(2); // Keep active for 2 transmissions
    logMessage('warn', `Triggered [${type.toUpperCase()}] anomaly. Next 2 packets will send abnormal values!`);
    
    // If running, we can trigger an immediate publish to test instantly
    if (isRunning) {
      publishTelemetry();
      setTimeLeft(intervalMinutes * 60); // Reset timer
    }
  };

  // Effect for timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Trigger publish
            publishTelemetry();
            return intervalMinutes * 60; // reset
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, intervalMinutes, ph, tds, waterTemp, doValue, turbidity, flowRate, activeAnomaly, isConnected]);

  // Adjust timeLeft when intervalMinutes changes
  useEffect(() => {
    if (isRunning) {
      setTimeLeft(intervalMinutes * 60);
    }
  }, [intervalMinutes]);

  // Format time remaining (e.g. 04:59)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Attempt initial connection on mount
  useEffect(() => {
    connectMqtt();
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation / Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Lobsense V2.0 <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-normal">SIMULATOR</span>
              </h1>
              <p className="text-xs text-slate-400">Virtual IoT Node Telemetry Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : isConnecting 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING...' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Panel: Configuration & MQTT Connection (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Connection Settings Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Database size={16} className="text-cyan-400" /> MQTT Broker Settings
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Host IP</label>
                <input 
                  type="text" 
                  value={mqttHost}
                  onChange={(e) => setMqttHost(e.target.value)}
                  disabled={isConnected}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">WS Port</label>
                <input 
                  type="text" 
                  value={mqttPort}
                  onChange={(e) => setMqttPort(e.target.value)}
                  disabled={isConnected}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              {!isConnected ? (
                <button
                  onClick={connectMqtt}
                  disabled={isConnecting}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-98 transition text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wifi size={14} /> Connect Broker
                </button>
              ) : (
                <button
                  onClick={disconnectMqtt}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 transition text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <WifiOff size={14} /> Disconnect
                </button>
              )}
            </div>
          </div>

          {/* IoT Node Registry Metadata Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Compass size={16} className="text-cyan-400" /> Device Registry Profile
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Serial Number</label>
                <input 
                  type="text" 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cage Code</label>
                <input 
                  type="text" 
                  value={cageCode}
                  onChange={(e) => setCageCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latitude</label>
                <input 
                  type="number" 
                  value={latitude}
                  step="0.000001"
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Longitude</label>
                <input 
                  type="number" 
                  value={longitude}
                  step="0.000001"
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Controller & Interval Info Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <RotateCw size={16} className="text-cyan-400" /> Simulation Config
            </h2>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Interval (Minutes)</label>
              <select 
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes (Real Interval)</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            {isRunning && (
              <div className="mt-2 p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl flex items-center justify-between">
                <span className="text-xs text-cyan-400 font-semibold tracking-wide">Next Transmission:</span>
                <span className="font-mono text-lg font-bold text-cyan-300 animate-pulse">{formatTime(timeLeft)}</span>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              {!isRunning ? (
                <button
                  onClick={startSimulation}
                  disabled={!isConnected}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 active:scale-98 transition text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  <Play size={14} fill="currentColor" /> Start Emulation
                </button>
              ) : (
                <button
                  onClick={stopSimulation}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 transition text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <Square size={14} fill="currentColor" /> Stop Emulation
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Middle Panel: Sliders & Sensor Target Adjustments (5 cols) */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-6">
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity size={16} className="text-cyan-400" /> Water Parameter baselines
          </h2>

          <div className="flex flex-col gap-5">
            {/* pH Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Potential of Hydrogen (pH)</span>
                <span className="font-mono text-cyan-400 font-bold">{ph.toFixed(1)} pH</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="14" 
                step="0.1"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>0.0 (Acidic)</span>
                <span>7.0 (Neutral)</span>
                <span>14.0 (Alkaline)</span>
              </div>
            </div>

            {/* TDS Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Total Dissolved Solids (TDS)</span>
                <span className="font-mono text-cyan-400 font-bold">{tds} ppm</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="10"
                value={tds}
                onChange={(e) => setTds(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>0 ppm</span>
                <span>500 ppm</span>
                <span>1000 ppm</span>
              </div>
            </div>

            {/* Water Temp Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Water Temperature</span>
                <span className="font-mono text-cyan-400 font-bold">{waterTemp.toFixed(1)} °C</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="40" 
                step="0.5"
                value={waterTemp}
                onChange={(e) => setWaterTemp(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>10.0 °C</span>
                <span>25.0 °C</span>
                <span>40.0 °C</span>
              </div>
            </div>

            {/* Dissolved Oxygen Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Dissolved Oxygen (DO)</span>
                <span className="font-mono text-cyan-400 font-bold">{doValue.toFixed(1)} mg/L</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="15" 
                step="0.1"
                value={doValue}
                onChange={(e) => setDoValue(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>0.0 mg/L</span>
                <span>7.5 mg/L</span>
                <span>15.0 mg/L</span>
              </div>
            </div>

            {/* Turbidity Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Turbidity (Kekeruhan)</span>
                <span className="font-mono text-cyan-400 font-bold">{turbidity.toFixed(1)} NTU</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="150" 
                step="1"
                value={turbidity}
                onChange={(e) => setTurbidity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>0.0 NTU (Clear)</span>
                <span>75.0 NTU</span>
                <span>150.0 NTU (Muddy)</span>
              </div>
            </div>

            {/* Flow Rate Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Water Flow Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{flowRate.toFixed(2)} L/min</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.05"
                value={flowRate}
                onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5 mt-0.5">
                <span>0.00 L/min</span>
                <span>2.50 L/min</span>
                <span>5.00 L/min</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Gyroscope & Trigger Anomalies (3 cols) */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Gyroscope Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Compass size={16} className="text-cyan-400" /> Gyro Orientation
            </h2>
            
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Pitch</span>
                  <span className="font-mono text-white text-xs">{pitch.toFixed(1)}°</span>
                </div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Roll</span>
                  <span className="font-mono text-white text-xs">{roll.toFixed(1)}°</span>
                </div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  value={roll} 
                  onChange={(e) => setRoll(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Yaw</span>
                  <span className="font-mono text-white text-xs">{yaw.toFixed(1)}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={yaw} 
                  onChange={(e) => setYaw(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950" 
                />
              </div>
            </div>
          </div>

          {/* Trigger Anomalies Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <AlertTriangle size={16} className="text-cyan-400" /> Trigger Anomalies
            </h2>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Force out-of-bounds metrics for the next 2 telemetry packets to test backend warnings & clamping.
            </p>

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                onClick={() => triggerAnomaly('ph')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  activeAnomaly === 'ph'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>Acidic pH Drop (pH 4.2)</span>
                {activeAnomaly === 'ph' ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 uppercase font-extrabold animate-pulse">active</span> : <AlertTriangle size={12} />}
              </button>

              <button
                onClick={() => triggerAnomaly('tds')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  activeAnomaly === 'tds'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>High TDS (850 ppm)</span>
                {activeAnomaly === 'tds' ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 uppercase font-extrabold animate-pulse">active</span> : <AlertTriangle size={12} />}
              </button>

              <button
                onClick={() => triggerAnomaly('do')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  activeAnomaly === 'do'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>Critical DO Hypoxia (2.1)</span>
                {activeAnomaly === 'do' ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 uppercase font-extrabold animate-pulse">active</span> : <AlertTriangle size={12} />}
              </button>

              <button
                onClick={() => triggerAnomaly('turbidity')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  activeAnomaly === 'turbidity'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>Muddy Water (110 NTU)</span>
                {activeAnomaly === 'turbidity' ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 uppercase font-extrabold animate-pulse">active</span> : <AlertTriangle size={12} />}
              </button>

              <button
                onClick={() => triggerAnomaly('flow')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  activeAnomaly === 'flow'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>Pump Failure (0.0 L/min)</span>
                {activeAnomaly === 'flow' ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 uppercase font-extrabold animate-pulse">active</span> : <AlertTriangle size={12} />}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Logger Panel (Full Width Bottom) */}
      <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-md p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Terminal size={16} className="text-cyan-400" /> Transmission Logs
            </h2>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] tracking-wider uppercase font-bold text-slate-500 hover:text-cyan-400 transition"
            >
              Clear Logs
            </button>
          </div>

          <div className="h-60 overflow-y-auto font-mono text-[11px] flex flex-col gap-2 pr-2 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic py-8 text-center flex flex-col items-center justify-center gap-1.5">
                <Terminal size={24} className="opacity-40" />
                No logs recorded yet. Start simulation or connect to see logs.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-900 border border-slate-850 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">[{log.timestamp}]</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        log.type === 'publish' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        log.type === 'warn' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        log.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>{log.type}</span>
                      <span className="text-slate-300 font-medium">{log.message}</span>
                    </div>
                  </div>
                  {log.details && (
                    <pre className="text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-900 overflow-x-auto text-[10px] leading-relaxed max-h-40">
                      {log.details}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
