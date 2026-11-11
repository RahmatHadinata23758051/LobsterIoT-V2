export const updateThresholdValue = (thresholds, index, field, value) =>
  thresholds.map((threshold, currentIndex) =>
    currentIndex === index ? { ...threshold, [field]: value } : threshold
  );
