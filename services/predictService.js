// You can later replace this with a trained ML model.
// For prototype: severity from rainfall thresholds, with day/time modifiers.

function predictSeverity(rainfall_mm, hour) {
  // Base thresholds for 3h accumulation
  if (rainfall_mm >= 40) return "heavy";
  if (rainfall_mm >= 15) return "mild";
  return "safe";
}

// Optional hotspot weighting map: intersections/roads prone to flood
// Later populate from your historical waterlogging_reports.
const hotspots = [
  { id: "Road_27", lat: 23.7459, lng: 90.3767, weight: 1.2 },
  { id: "Road_32", lat: 23.7478, lng: 90.3819, weight: 1.1 },
  { id: "Lake_West", lat: 23.7462, lng: 90.3749, weight: 1.3 },
];

function adjustByHotspot(severity, weight) {
  // escalate severity if hotspot weight is high
  const levels = ["safe", "mild", "heavy"];
  let idx = levels.indexOf(severity);
  if (weight >= 1.25 && idx < 2) idx += 1;
  return levels[idx];
}

function predictForHotspots(forecastSlice) {
  // forecastSlice: { timestamp, date, hour, rainfall_mm }
  return hotspots.map((h) => {
    const base = predictSeverity(forecastSlice.rainfall_mm, forecastSlice.hour);
    const adjusted = adjustByHotspot(base, h.weight);
    const credibility = adjusted === "heavy" ? 8 : adjusted === "mild" ? 4 : 1;
    return {
      location_id: h.id,
      latitude: h.lat,
      longitude: h.lng,
      predicted_severity: adjusted,
      rainfall_mm: forecastSlice.rainfall_mm,
      timestamp: forecastSlice.timestamp,
      date: forecastSlice.date,
      credibility, // simple confidence score
    };
  });
}

module.exports = { predictForHotspots };
