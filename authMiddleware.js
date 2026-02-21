const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ error: "No token provided" });
  console.log("Auth header:", req.headers.authorization);

  const token = authHeader.split(" ")[1];
  try {
    console.log("Token to verify:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded payload:", decoded);

    if (decoded.role === "admin") {
      req.user = decoded;
      return next();
    }
    return res.status(403).json({ error: "Admin access required" });
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = { requireAdmin };
