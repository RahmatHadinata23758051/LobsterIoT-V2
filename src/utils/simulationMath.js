/**
 * Simulation Mathematics & Payload Helpers
 * Pure JS functions representing the diurnal cycle model, linear interpolation, noise, and payload builders.
 */

// Calculate target baseline values based on diurnal time-series cycle
export function calculateDiurnalValues(t) {
  return {
    waterTemp: 27.2 + 1.3 * Math.cos((2 * Math.PI * (t - 15)) / 24),
    ambientTemp: 29.5 + 3.5 * Math.cos((2 * Math.PI * (t - 14)) / 24),
    ph: 7.4 + 0.25 * Math.cos((2 * Math.PI * (t - 16)) / 24),
    doValue: 6.2 + 1.0 * Math.cos((2 * Math.PI * (t - 16)) / 24),
    tds: 250,
    turbidity: 12.0,
    flowRate: 0.35
  };
}

// Linear interpolation (Lerp) to smoothly shift between values
export function lerp(current, target, alpha) {
  return current + alpha * (target - current);
}

// Generate minor sensor jitter noise
export function getJitter(range) {
  return (Math.random() - 0.5) * range;
}

// Format seconds left for next transmission (e.g. 00:05)
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}

// Format total remaining simulation run-time (e.g. 01:23:45)
export function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return hrs.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}

// Format simulated hour (e.g. 14:30)
export function formatSimulatedTime(decimalHour) {
  const hours = Math.floor(decimalHour);
  const minutes = Math.floor((decimalHour - hours) * 60);
  return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
}

// Construct the telemetry packet object
export function createTelemetryPayload({
  serialNumber,
  cageCode,
  latitude,
  longitude,
  metrics,
  timestamp
}) {
  return {
    serial_number: serialNumber,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    cage_code: cageCode,
    latitude: parseFloat(latitude ?? -8.6529),
    longitude: parseFloat(longitude ?? 116.3195),
    raw_values: {
      temperature_node: parseFloat(metrics.waterTemp.toFixed(2)),
      ambient_temperature: parseFloat(metrics.ambientTemp.toFixed(2)),
      ph: parseFloat(metrics.ph.toFixed(2)),
      tds: parseFloat(metrics.tds.toFixed(1)),
      raw_dissolved_oxygen: parseFloat(metrics.doValue.toFixed(2)),
      turbidity: parseFloat(metrics.turbidity.toFixed(2)),
      salinity: 0.0,
      flow_rate: parseFloat(metrics.flowRate.toFixed(3)),
      pitch: parseFloat(metrics.pitch.toFixed(2)),
      roll: parseFloat(metrics.roll.toFixed(2)),
      yaw: parseFloat(metrics.yaw.toFixed(1)),
      pump_status: metrics.flowRate > 0.05 ? 1 : 0
    }
  };
}
