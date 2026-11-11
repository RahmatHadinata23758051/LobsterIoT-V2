import assert from 'node:assert/strict';

const updateThreshold = (thresholds, index, field, value) =>
  thresholds.map((item, currentIndex) =>
    currentIndex === index ? { ...item, [field]: value } : item
  );

const current = [
  { sensor_code: 'ph', value_min: 6.5, value_max: 8.5 },
  { sensor_code: 'tds', value_min: 100, value_max: 500 }
];
const updated = updateThreshold(current, 1, 'value_min', '120');

assert.notEqual(updated, current);
assert.notEqual(updated[1], current[1]);
assert.equal(current[1].value_min, 100, 'Original threshold remains unchanged');
assert.equal(updated[1].value_min, '120');
assert.equal(updated[0], current[0], 'Unchanged entries are reused');
