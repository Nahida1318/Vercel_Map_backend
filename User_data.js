const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const db = require("./database.js");
const jwt = require("jsonwebtoken");
router.use(bodyParser.json());




router.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO user_data (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, role || "user"],
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});





router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Query to find the user by email
    const { rows } = await db.query(
      "SELECT * FROM user_data WHERE email = $1",
      [email],
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    // Compare hashed provided password with stored hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ Generate token 
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET,
    { expiresIn: "7d" } );

      console.log("Generated token:", token);
      


    // Successfully authenticated
    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role, // ✅ include role here
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});









router.post("/favourite", async (req, res) => {
  const {
    user_id,
    current_lat,
    current_lng,
    destination_lat,
    destination_lng,
  } = req.body;

  if (
    !user_id ||
    !current_lat ||
    !current_lng ||
    !destination_lat ||
    !destination_lng
  ) {
    return res.status(400).json({ error: "all information are required" });
  }

  try {
    // Query to find the user by email
    const result = await db.query(
      "INSERT INTO favourite (user_id, current_latitude, current_longitude, destination_latitude, destination_longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, current_lat, current_lng, destination_lat, destination_lng]
    );
    // Successfully authenticated
    // Here you would typically assign a token or start a session
    res.status(200).json({ message: "successful", result: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/history", async (req, res) => {
  const {
    user_id,
    current_lat,
    current_lng,
    destination_lat,
    destination_lng,
  } = req.body;

  if (
    !user_id ||
    !current_lat ||
    !current_lng ||
    !destination_lat ||
    !destination_lng
  ) {
    return res.status(400).json({ error: "all information are required" });
  }

  try {
    // Query to find the user by email
    const result = await db.query(
      "INSERT INTO history (user_id, current_latitude, current_longitude, destination_latitude, destination_longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, current_lat, current_lng, destination_lat, destination_lng]
    );
    // Successfully authenticated
    // Here you would typically assign a token or start a session
    res.status(200).json({ message: "successful", result: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history/:user_id", async (req, res) => {
  user_id = req.params.user_id;

  try {
    const result = await db.query(
      "SELECT * FROM history\
            WHERE user_id=$1\
            ",
      [user_id]
    );

    console.log(result.rows);
    res.send({ result: result.rows });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

router.get("/favourite/:user_id", async (req, res) => {
  user_id = req.params.user_id;

  try {
    const result = await db.query(
      "SELECT * FROM favourite\
            WHERE user_id=$1\
            ",
      [user_id]
    );

    console.log(result.rows);
    res.send({ result: result.rows });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

router.post("/rating/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const { rating } = req.body;
  console.log(user_id);
  console.log(rating);

  try {
    // Query to find the user by email
    const result = await db.query(
      "UPDATE user_data\
            SET rating = $1\
            WHERE id = $2 RETURNING *",
      [rating, user_id]
    );
    // Successfully authenticated
    // Here you would typically assign a token or start a session
    res.status(200).json({ message: "successful", result: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/:user_id", async (req, res) => {
  const user_id = req.params.user_id;

  try {
    // Query to find the user by email
    const { rows } = await db.query(
      "SELECT * FROM user_data WHERE id = $1",
      [user_id]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];


    // Successfully authenticated
    // Here you would typically assign a token or start a session
    res
      .status(200)
      .json({
        user: user,
      });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});


module.exports = router;
