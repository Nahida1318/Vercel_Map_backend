const fs = require("fs");
const csv = require("csv-parser");

async function loadRainfallCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          date: row.date,
          location_id: row.location_id,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          rainfall_mm: parseFloat(row.rainfall_mm),
          timestamp: new Date(row.date).getTime(),
          hour: new Date(row.date).getHours(),
        });
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

module.exports = { loadRainfallCSV };
