const express = require('express')
const app = express()
require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");

const cors = require('cors');

app.use(express.json());

// Use CORS middleware
app.use(cors());





const serverless = require("serverless-http");

module.exports = app;
module.exports.handler = serverless(app);




const Police_data = require('./Police_data')
const User_data = require('./User_data')

app.use('/api/waterlogging', Police_data)
app.use('/api/user', User_data)

// const predictionRoutes = require("./routes/prediction");
// app.use("/api/predict", predictionRoutes);

// const predictRoutes = require("./routes/csvPrediction");
// app.use("/api/csvPredict", predictRoutes);


const roadGeometry = require("./data/roads_geometry.json");


app.get("/api/predictions", (req, res) => {
  const results = {};
  fs.createReadStream("data/waterlogging_monthly_predictions_2026.csv")
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
        occurrence: parseInt(row.pred_occurrence),
        duration: parseFloat(row.pred_duration),
      });
    })
    .on("end", () => {
      res.json(Object.values(results));
    });
});















// app.listen(5001, "0.0.0.0", () => {
//   console.log("Server is running on port 5001");
// });




app.get("/", (req, res) => {
  res.send("Backend is running on Vercel!");
});
