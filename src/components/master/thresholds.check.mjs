import assert from 'node:assert/strict';
import { updateThresholdValue } from './thresholds.js';

const original = [
  { sensor_code: 'ph', value_min: 6.5, value_max: 8.5 },
  { sensor_code: 'tds', value_min: 100, value_max: 500 }
];
const updated = updateThresholdValue(original, 1, 'value_min', '120');

assert.notEqual(updated, original);
assert.notEqual(updated[1], original[1]);
assert.equal(original[1].value_min, 100, 'Original threshold remains unchanged');
assert.equal(updated[1].value_min, '120');
assert.equal(updated[0], original[0], 'Unchanged entries are reused');
