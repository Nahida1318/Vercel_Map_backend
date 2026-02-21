const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const { getForecastByCoord } = require("../services/weatherService");
const { predictForHotspots } = require("../services/predictService");

router.get("/forecast-predictions", async (req, res) => {
  try {
    const lat = Number(process.env.DHANMONDI_CENTER_LAT || 23.7465);
    const lon = Number(process.env.DHANMONDI_CENTER_LNG || 90.378);

    const forecast = await getForecastByCoord(lat, lon); // array of 3h blocks

    // Next 24 hours (first 8 blocks)
    const next24 = forecast.slice(0, 8);

    // For each block, predict hotspots
    const predictionsTimeline = next24.map((block) => ({
      date: block.date,
      hour: block.hour,
      rainfall_mm: block.rainfall_mm,
      hotspots: predictForHotspots(block),
    }));

    res.json({ center: { lat, lon }, predictions: predictionsTimeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate predictions" });
  }
});

module.exports = router;



