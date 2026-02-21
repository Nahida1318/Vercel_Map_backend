const axios = require("axios");
const { OPENWEATHER_API_KEY } = process.env;

// Get 5-day/3-hour forecast for a coordinate
async function getForecastByCoord(lat, lon) {
  const url = "https://api.openweathermap.org/data/2.5/forecast";
  const params = {
    lat,
    lon,
    appid: OPENWEATHER_API_KEY,
    units: "metric",
  };
  const { data } = await axios.get(url, { params });
  // Normalize to { timestamp, rainfall_mm, hour, date }
  return data.list.map((item) => {
    const ts = item.dt * 1000;
    const hour = new Date(ts).getHours();
    const date = new Date(ts).toISOString();
    // Rain in mm for 3h block; if no rain key, assume 0
    const rainfall_mm = item.rain?.["3h"] || 0;

    return { timestamp: ts, date, hour, rainfall_mm, item };
  });
}

module.exports = { getForecastByCoord };
