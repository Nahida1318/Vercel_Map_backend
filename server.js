const express = require('express')
const app = express()
require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");

const cors = require('cors');

app.use(express.json());

// Use CORS middleware
app.use(cors());




const Police_data = require('./Police_data')
const User_data = require('./User_data')

app.use('/api/waterlogging', Police_data)
app.use('/api/user', User_data)



const roadGeometry = require("./data/roads_geometry.json");

app.get("/api/predictions", (req, res) => {
  const results = {};

  fs.createReadStream("data/dhanmondi_2026_predictions.csv")
    .pipe(csv())
    .on("data", (row) => {
      const road = row.road_name;

      if (!results[road]) {
        const geometry =
          roadGeometry.find((r) => r.road_name === road)?.geometry || [];
        results[road] = { road_name: road, geometry, predictions: [] };
      }

      results[road].predictions.push({
        date: row.date,
        month: new Date(row.date).toLocaleString("default", { month: "short" }),
        occurrence: parseInt(row.waterlogging_occurrence), // ← column name in your CSV
        duration: parseFloat(row.waterlogging_duration), // ← column name in your CSV
      });
    })
    .on("end", () => {
      res.json(Object.values(results));
    })
    .on("error", (err) => {
      console.error("CSV read error:", err);
      res.status(500).json({ error: "Failed to read predictions CSV." });
    });
});









app.listen(5001,'0.0.0.0',() => {
  console.log("Server is running on port 5001");
});



module.exports = app;