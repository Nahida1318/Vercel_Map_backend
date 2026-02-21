

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("./database.js");
const sendNotification = require("./mailer"); // optional if you want email alerts
const { requireAdmin } = require("./authMiddleware");

router.use(bodyParser.json());


// Get all waterlogging reports with credibility
router.get("/all", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, latitude, longitude, severity, description, date_reported,
      likes, verifications, disapprovals,
      (likes + verifications - disapprovals) AS credibility
      FROM waterlogging_reports
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

router.get("/reports", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, severity, description, date_reported, ST_AsGeoJSON(geom) AS geom FROM waterlogging_area_reports",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching reports");
  }
});



// Delete single waterlogging report
router.delete("/report/:id", requireAdmin, async (req, res) => {
  try {
    const reportId = req.params.id;
    await db.query("DELETE FROM waterlogging_reports WHERE id=$1", [reportId]);
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// Delete single area report
router.delete("/area/:id", requireAdmin, async (req, res) => {
  try {
    const areaId = req.params.id;
    await db.query("DELETE FROM waterlogging_area_reports WHERE id=$1", [
      areaId,
    ]);
    res.json({ message: "Area report deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete area report" });
  }
});












// Delete all reports
router.delete("/deleteAll", async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM waterlogging_reports RETURNING *"
    );
    if (result.rowCount === 0) {
      res.status(404).send({ message: "No reports found to delete" });
    } else {
      res.send({
        message: "All reports deleted successfully",
        records: result.rows,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});



// Insert sample reports (for testing)
router.post("/new", async (req, res) => {
  try {
    const query = `
      INSERT INTO waterlogging_reports (latitude, longitude, severity, description, date_reported)
      VALUES
        (23.7465, 90.3780, 'heavy', 'Road fully submerged near Jigatola', '2025-12-14'),
        (23.7500, 90.3740, 'mild', 'Water up to ankle near Shankar', '2025-12-14'),
        (23.7525, 90.3820, 'safe', 'No waterlogging near Dhanmondi 27', '2025-12-14')
      RETURNING *;
    `;
    const result = await db.query(query);
    console.log("Sample reports inserted");
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});







// Handle user-submitted waterlogging report
router.post("/report", async (req, res) => {
  const { lat, lng, severity, description, date, user_id } = req.body;

  // Step 1: basic required fields
  if (lat == null || lng == null || !severity || !date || !user_id) {
    return res.status(400).json({
      error: "Latitude, longitude, severity, date, and user_id are required"
    });
  }

  // Step 2: validate severity against allowed options
  const validSeverities = [
    "safe",
    "mild",
    "heavy",
    "manhole_open",
    "very_mudded"
  ];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({ error: "Invalid severity option" });
  }

  try {
    // Step 3: check if user exists
    const userCheck = await db.query("SELECT id FROM user_data WHERE id=$1", [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: "Invalid user — must be logged in" });
    }

    // Step 4: insert report
    const result = await db.query(
      "INSERT INTO waterlogging_reports (latitude, longitude, severity, description, date_reported) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [lat, lng, severity, description || "", date]
    );

    // Step 5: notify users whose favorite routes overlap
    const favorites = await db.query(
      `SELECT u.email, f.current_latitude, f.current_longitude, f.destination_latitude, f.destination_longitude 
       FROM favourite f
       JOIN user_data u ON f.user_id = u.id 
       WHERE ABS(f.current_latitude - $1) < 0.01 AND ABS(f.current_longitude - $2) < 0.01`,
      [lat, lng]
    );

    for (const favorite of favorites.rows) {
      const emailText = `⚠️ Waterlogging report (${severity}) at (${lat}, ${lng}) on ${date}.
Description: ${description || "No details provided"}.
This location overlaps with one of your favorite routes.`;
      await sendNotification(favorite.email, "Waterlogging Alert", emailText);
    }

    res.status(200).json({
      message: "Report submitted successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});




router.post("/feedback/:id", async (req, res) => {
  const { type, user_id } = req.body;
  const reportId = req.params.id;

  if (!user_id) {
    return res
      .status(401)
      .json({ error: "You must be logged in to give feedback" });
  }

  if (!["like", "verify", "disapprove"].includes(type)) {
    return res.status(400).json({ error: "Invalid feedback type" });
  }

  try {
    // check if user exists
    const userCheck = await db.query("SELECT id FROM user_data WHERE id=$1", [
      user_id,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // prevent duplicate feedback
    const existing = await db.query(
      "SELECT * FROM report_feedback WHERE user_id=$1 AND report_id=$2",
      [user_id, reportId]
    );
    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You already gave feedback for this report" });
    }

    await db.query(
      "INSERT INTO report_feedback (user_id, report_id, type) VALUES ($1,$2,$3)",
      [user_id, reportId, type]
    );

    const column =
      type === "like"
        ? "likes"
        : type === "verify"
        ? "verifications"
        : "disapprovals";
    const result = await db.query(
      `UPDATE waterlogging_reports SET ${column}=${column}+1 WHERE id=$1 RETURNING *`,
      [reportId]
    );

    res.json({ message: "Feedback recorded", report: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get danger zones (severe waterlogging)
router.get("/waterlog-danger-zones", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT latitude, longitude FROM waterlogging_reports 
      WHERE severity IN ('heavy', 'manhole_open', 'very_mudded')
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch waterlogging data" });
  }
});




// Handle user-submitted area waterlogging report
router.post("/report-area", async (req, res) => {
  const { polygon, severity, description, date, user_id } = req.body;

  // Step 1: basic required fields
  if (!polygon || !severity || !date || !user_id) {
    return res.status(400).json({
      error: "Polygon, severity, date, and user_id are required"
    });
  }

  // Step 2: validate severity
  const validSeverities = ["safe", "mild", "heavy", "manhole_open", "very_mudded"];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({ error: "Invalid severity option" });
  }

  try {
    // Step 3: check user exists
    const userCheck = await db.query("SELECT id FROM user_data WHERE id=$1", [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: "Invalid user — must be logged in" });
    }

    // Step 4: insert polygon report (stored as GeoJSON string)
    const result = await db.query(
      "INSERT INTO waterlogging_area_reports (severity, description, date_reported, geom) VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4)) RETURNING *",
      [severity, description || "", date, JSON.stringify({ type: "Polygon", coordinates: [polygon] })]
    );

    // Step 5: notify users (similar overlap logic, but using spatial intersection instead of ABS difference)
    // Example: ST_Intersects(favourite_route_geom, geom)

    res.status(200).json({
      message: "Area report submitted successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
















module.exports = router;







