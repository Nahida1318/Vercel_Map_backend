const express = require("express");
const router = express.Router();

const { loadRainfallCSV } = require("../services/csvService");
const { predictForHotspots } = require("../services/predictService");

router.get("/csv-predictions", async (req, res) => {
  try {
    const rainfallData = await loadRainfallCSV("data/rainfall_dhanmondi.csv");

    const predictions = rainfallData.map((block) => ({
      date: block.date,
      rainfall_mm: block.rainfall_mm,
      hotspots: predictForHotspots(block),
    }));

    res.json({ predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load CSV predictions" });
  }
});

module.exports = router;