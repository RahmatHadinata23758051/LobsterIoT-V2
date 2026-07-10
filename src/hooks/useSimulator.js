import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { 
  calculateDiurnalValues, 
  lerp, 
  getJitter, 
  createTelemetryPayload 
} from '../utils/simulationMath';

export default function useSimulator() {
  // Backend API Integration State
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [authEmail, setAuthEmail] = useState('admin@lobsense.com');
  const [authPassword, setAuthPassword] = useState('Admin2026Lob');
  const [authToken, setAuthToken] = useState('');
  const [isApiConnecting, setIsApiConnecting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [nodes, setNodes] = useState([
    { serial_number: 'DEMO-NODE-001', latitude: -8.6529, longitude: 116.3195 }
  ]);
  const [selectedNode, setSelectedNode] = useState({ serial_number: 'DEMO-NODE-001', latitude: -8.6529, longitude: 116.3195 });
  const [cages, setCages] = useState([
    { cage_code: 'CAGE-A01' }
  ]);
  const [selectedCage, setSelectedCage] = useState({ cage_code: 'CAGE-A01' });

  // MQTT Connection State
  const [mqttHost, setMqttHost] = useState('127.0.0.1');
  const [mqttPort, setMqttPort] = useState('9001'); // WebSockets port
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mqttClient, setMqttClient] = useState(null);

  // Active Anomalies state
  const [activeAnomaly, setActiveAnomaly] = useState(null); // 'ph', 'tds', 'do', 'turbidity', 'flow'
  const [anomalyDuration, setAnomalyDuration] = useState(0); // number of transmissions left for anomaly

  // Clock & Time Simulation State
  const [clockMode, setClockMode] = useState('fast'); // 'real' or 'fast'
  const [simulatedTime, setSimulatedTime] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  // Emulation Mode & Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [runMode, setRunMode] = useState('nonstop'); // 'nonstop' or 'timed'
  const [durationHours, setDurationHours] = useState(1); // Default 1 hour
  const [intervalSeconds, setIntervalSeconds] = useState(5); // Default 5 seconds
  const [timeLeft, setTimeLeft] = useState(5); // Countdown for next transmission
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0); // Total remaining simulation run-time
  const [totalSimulationSeconds, setTotalSimulationSeconds] = useState(0); // Total scheduled run-time

  // Live Telemetry Values (For UI Cockpit Display)
  const [liveMetrics, setLiveMetrics] = useState({
    waterTemp: 27.2,
    ambientTemp: 29.5,
    ph: 7.4,
    tds: 250,
    doValue: 6.2,
    turbidity: 12.0,
    flowRate: 0.35,
    pitch: 0.5,
    roll: -1.0,
    yaw: 180.0
  });

  // Logger
  const [logs, setLogs] = useState([]);
  
  // Refs
  const clientRef = useRef(null);
  const timerRef = useRef(null);
  const simulatedTimestampRef = useRef(null);
  
  // Persistent currentValues ref to apply linear interpolation (Lerp) for smooth data shift
  const currentValuesRef = useRef({
    waterTemp: 27.2,
    ambientTemp: 29.5,
    ph: 7.4,
    tds: 250.0,
    doValue: 6.2,
    turbidity: 12.0,
    flowRate: 0.35
  });

  // Helper to append logs
  const logMessage = (type, message, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Date.now() + Math.random(), timestamp, type, message, details },
      ...prev.slice(0, 99) // limit to last 100 logs
    ]);
  };

  // Backend API Authentication & Synchronization
  const handleApiLogin = async () => {
    setIsApiConnecting(true);
    setApiError('');
    logMessage('info', 'Authenticating with Backend API at ' + apiUrl + '...');
    try {
      const response = await fetch(apiUrl.replace(/\/$/, '') + '/api/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const resData = await response.json();
      if (resData.status === 'success' && resData.data && resData.data.token) {
        const token = resData.data.token;
        setAuthToken(token);
        logMessage('success', 'Successfully authenticated with Backend API!');
        await fetchNodesAndCages(token);
      } else {
        throw new Error(resData.message || 'Invalid email or password credentials.');
      }
    } catch (e) {
      setApiError(e.message);
      logMessage('error', 'API Synchronization failed: ' + e.message);
    } finally {
      setIsApiConnecting(false);
    }
  };

  // Fetch registered nodes & cages from backend
  const fetchNodesAndCages = async (token) => {
    try {
      const headers = { 
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      };
      
      // Fetch Nodes
      const nodesResponse = await fetch(apiUrl.replace(/\/$/, '') + '/api/v2/iot-nodes-master', { headers });
      const nodesData = await nodesResponse.json();
      
      if (nodesData.status === 'success' && Array.isArray(nodesData.data)) {
        const activeNodes = nodesData.data;
        if (activeNodes.length > 0) {
          setNodes(activeNodes);
          setSelectedNode(activeNodes[0]);
          logMessage('info', 'Loaded ' + activeNodes.length + ' registered IoT Nodes from database.');
        } else {
          logMessage('warn', 'No registered IoT Nodes found in the database. Using fallback.');
        }
      }

      // Fetch Cages
      const cagesResponse = await fetch(apiUrl.replace(/\/$/, '') + '/api/v2/cages', { headers });
      const cagesData = await cagesResponse.json();
      if (cagesData.status === 'success' && Array.isArray(cagesData.data)) {
        const activeCages = cagesData.data;
        if (activeCages.length > 0) {
          setCages(activeCages);
          setSelectedCage(activeCages[0]);
          logMessage('info', 'Loaded ' + activeCages.length + ' registered Cages from database.');
        }
      }
    } catch (e) {
      logMessage('error', 'Failed to fetch registered components: ' + e.message);
    }
  };

  // Connect to MQTT Broker
  const connectMqtt = () => {
    if (clientRef.current) {
      clientRef.current.end();
    }

    setIsConnecting(true);
    logMessage('info', 'Connecting to Mosquitto MQTT broker at ws://' + mqttHost + ':' + mqttPort + '...');

    try {
      const client = mqtt.connect('ws://' + mqttHost + ':' + mqttPort, {
        keepalive: 60,
        clientId: 'lobsense_emulator_' + Math.random().toString(16).substring(2, 8),
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      clientRef.current = client;

      client.on('connect', () => {
        if (clientRef.current === client) {
          setIsConnected(true);
          setIsConnecting(false);
          setMqttClient(client);
          logMessage('success', 'Connected to MQTT broker via WebSockets successfully!');
        }
      });

      client.on('error', (err) => {
        if (clientRef.current === client) {
          setIsConnecting(false);
          logMessage('error', 'Connection error: ' + err.message);
        }
      });

      client.on('close', () => {
        if (clientRef.current === client) {
          setIsConnected(false);
          setIsConnecting(false);
          logMessage('info', 'MQTT connection closed.');
        }
      });

    } catch (e) {
      setIsConnecting(false);
      logMessage('error', 'Failed to initialize MQTT client: ' + e.message);
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

  // Helper to resolve current simulated hour (0.0 to 23.99)
  const getSimulatedHour = () => {
    if (clockMode === 'real') {
      const now = new Date();
      return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    }
    return simulatedTime;
  };

  // Generate & Publish Telemetry Payload
  const publishTelemetry = () => {
    if (!clientRef.current || !isConnected) {
      logMessage('warn', 'Failed to publish: MQTT client is not connected.');
      return;
    }

    // 1. Resolve current simulated hour
    let t = getSimulatedHour();
    let timestampToUse = Math.floor(Date.now() / 1000);

    // If fast mode, progress the simulated clock for the NEXT step
    if (clockMode === 'fast') {
      if (simulatedTimestampRef.current === null) {
        // Start from exactly 24 hours ago
        simulatedTimestampRef.current = timestampToUse - 24 * 3600;
      } else {
        // Advance by 10 minutes (600 seconds)
        simulatedTimestampRef.current += 600;
      }
      timestampToUse = simulatedTimestampRef.current;

      setSimulatedTime(prev => {
        let next = prev + (10 / 60); // advance 10 minutes (0.1667 hours)
        if (next >= 24) next -= 24;
        return next;
      });
    }

    // 2. Define baseline target values based on time-series sinusoidal formula (diurnal cycle)
    const baseTarget = calculateDiurnalValues(t);

    // 3. Resolve active target considering active anomalies
    let targetWaterTemp = baseTarget.waterTemp;
    let targetAmbientTemp = baseTarget.ambientTemp;
    let targetPh = baseTarget.ph;
    let targetTds = baseTarget.tds;
    let targetDo = baseTarget.doValue;
    let targetTurbidity = baseTarget.turbidity;
    let targetFlow = baseTarget.flowRate;

    if (activeAnomaly && anomalyDuration > 0) {
      if (activeAnomaly === 'ph') {
        targetPh = 5.2; // Smooth drop to acidic pH
      } else if (activeAnomaly === 'tds') {
        targetTds = 680; // Smooth rise to high minerals
      } else if (activeAnomaly === 'do') {
        targetDo = 2.8; // Smooth drop to hypoxia DO
      } else if (activeAnomaly === 'turbidity') {
        targetTurbidity = 110; // Smooth rise to muddy water
      } else if (activeAnomaly === 'flow') {
        targetFlow = 0.0; // Smooth drop to pump failure
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

    // 4. Smooth interpolation (Linear Interpolation - Lerp) towards target values
    const lerpAlpha = 0.25; // 25% shift per 5-second interval

    const nextWaterTemp = lerp(currentValuesRef.current.waterTemp, targetWaterTemp, lerpAlpha);
    const nextAmbientTemp = lerp(currentValuesRef.current.ambientTemp, targetAmbientTemp, lerpAlpha);
    const nextPh = lerp(currentValuesRef.current.ph, targetPh, lerpAlpha);
    const nextTds = lerp(currentValuesRef.current.tds, targetTds, lerpAlpha);
    const nextDo = lerp(currentValuesRef.current.doValue, targetDo, lerpAlpha);
    const nextTurbidity = lerp(currentValuesRef.current.turbidity, targetTurbidity, lerpAlpha);
    const nextFlow = lerp(currentValuesRef.current.flowRate, targetFlow, lerpAlpha);

    // Save back to Ref for the next loop
    currentValuesRef.current = {
      waterTemp: nextWaterTemp,
      ambientTemp: nextAmbientTemp,
      ph: nextPh,
      tds: nextTds,
      doValue: nextDo,
      turbidity: nextTurbidity,
      flowRate: nextFlow
    };

    // 5. Apply minor random jitter (noise) representing sensor electrical micro-fluctuations
    const publishedWaterTemp = nextWaterTemp + getJitter(0.05);
    const publishedAmbientTemp = nextAmbientTemp + getJitter(0.15);
    const publishedPh = nextPh + getJitter(0.02);
    const publishedTds = nextTds + getJitter(1.5);
    const publishedDo = nextDo + getJitter(0.04);
    const publishedTurbidity = nextTurbidity + getJitter(0.2);
    const publishedFlow = Math.max(0, nextFlow + getJitter(0.005));

    // Gyro calculations (jittery hovering)
    const publishedPitch = 0.5 + getJitter(0.1);
    const publishedRoll = -1.0 + getJitter(0.1);
    const publishedYaw = 180.0 + getJitter(0.4);

    const telemetryMetrics = {
      waterTemp: publishedWaterTemp,
      ambientTemp: publishedAmbientTemp,
      ph: publishedPh,
      tds: publishedTds,
      doValue: publishedDo,
      turbidity: publishedTurbidity,
      flowRate: publishedFlow,
      pitch: publishedPitch,
      roll: publishedRoll,
      yaw: publishedYaw
    };

    // Update UI Cockpit display values
    setLiveMetrics({
      ...telemetryMetrics,
      tds: Math.round(publishedTds)
    });

    const payload = createTelemetryPayload({
      serialNumber: selectedNode.serial_number,
      cageCode: selectedCage.cage_code,
      latitude: selectedNode.latitude,
      longitude: selectedNode.longitude,
      metrics: telemetryMetrics,
      timestamp: timestampToUse
    });

    const payloadString = JSON.stringify(payload, null, 2);
    
    try {
      clientRef.current.publish('lobsense/telemetry', JSON.stringify(payload));
      logMessage('publish', 'Published to topic [lobsense/telemetry] (Node: ' + selectedNode.serial_number + ')', payloadString);
    } catch (e) {
      logMessage('error', 'Publish failed: ' + e.message);
    }
  };

  // Start Simulation
  const startSimulation = () => {
    if (!isConnected) {
      logMessage('warn', 'Please connect to the MQTT broker first before starting the simulation.');
      return;
    }
    
    // Reset simulated timestamp ref on start
    simulatedTimestampRef.current = null;
    
    const secs = durationHours * 3600;
    setIsRunning(true);
    setTimeLeft(intervalSeconds);
    setTimeRemainingSeconds(secs);
    setTotalSimulationSeconds(secs);

    logMessage('success', 'Simulation started on Node: ' + selectedNode.serial_number + ' (' + (runMode === 'nonstop' ? 'Nonstop Mode' : 'Timed Mode: ' + durationHours + ' hour(s)') + ').');
    publishTelemetry();
  };

  // Stop Simulation
  const stopSimulation = () => {
    setIsRunning(false);
    simulatedTimestampRef.current = null;
    logMessage('info', 'Simulation stopped.');
  };

  // Trigger Anomaly Helper
  const triggerAnomaly = (type) => {
    setActiveAnomaly(type);
    setAnomalyDuration(6); // Smooth transition spans 6 intervals (30 seconds)
    logMessage('warn', 'Triggered [' + type.toUpperCase() + '] anomaly. Target will smoothly shift to out-of-bounds levels.');
    
    // If running, we can trigger an immediate publish to test instantly
    if (isRunning) {
      publishTelemetry();
      setTimeLeft(intervalSeconds); // Reset timer
    }
  };

  // Keep publishTelemetryRef updated to avoid resetting timer setInterval on state changes
  const publishTelemetryRef = useRef(publishTelemetry);
  useEffect(() => {
    publishTelemetryRef.current = publishTelemetry;
  }, [publishTelemetry]);

  // Effect for timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            publishTelemetryRef.current();
            return intervalSeconds;
          }
          return prev - 1;
        });

        // Handle Timed execution countdown
        if (runMode === 'timed') {
          setTimeRemainingSeconds(rem => {
            if (rem <= 1) {
              stopSimulation();
              logMessage('info', 'Emulation duration limit reached. Connection halted.');
              return 0;
            }
            return rem - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, intervalSeconds, runMode]);

  // Adjust timeLeft when intervalSeconds changes
  useEffect(() => {
    if (isRunning) {
      setTimeLeft(intervalSeconds);
    }
  }, [intervalSeconds]);

  // Attempt initial connection on mount
  useEffect(() => {
    connectMqtt();
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  // Map node changes to selectedNode state helper
  const handleNodeSelect = (serial) => {
    const found = nodes.find(n => n.serial_number === serial);
    if (found) {
      setSelectedNode(found);
      logMessage('info', 'Selected IoT Node: ' + found.serial_number);
    }
  };

  // Map cage changes to selectedCage state helper
  const handleCageSelect = (code) => {
    const found = cages.find(c => c.cage_code === code);
    if (found) {
      setSelectedCage(found);
      logMessage('info', 'Selected Cage Map: ' + found.cage_code);
    }
  };

  return {
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
  };
}
