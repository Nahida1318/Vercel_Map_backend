const db = require("../database.js");

// Query verified danger zones (lat/lon points)
async function getDangerZones() {
  const result = await db.query(`
    SELECT latitude, longitude
    FROM waterlogging_reports
    WHERE status='Verified'
      AND severity IN ('heavy','manhole_open','very_mudded')
  `);
  return result.rows.map((r) => ({ lat: r.latitude, lng: r.longitude }));
}

// Heuristic: straight-line (Haversine) distance
function haversineDistance(a, b) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Check if a node is inside danger zones
function isDanger(node, dangerZones) {
  return dangerZones.some(
    (zone) =>
      Math.abs(node.lat - zone.lat) < 0.0005 &&
      Math.abs(node.lng - zone.lng) < 0.0005,
  );
}

// A* pathfinding (simplified grid/graph version)
function aStar(origin, destination, graphNodes, dangerZones = []) {
  const openSet = [origin];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const key = (n) => `${n.lat},${n.lng}`;
  gScore.set(key(origin), 0);
  fScore.set(key(origin), haversineDistance(origin, destination));

  while (openSet.length > 0) {
    // pick node with lowest fScore
    openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
    const current = openSet.shift();

    if (
      Math.abs(current.lat - destination.lat) < 0.0001 &&
      Math.abs(current.lng - destination.lng) < 0.0001
    ) {
      // reconstruct path
      const path = [];
      let u = key(current);
      while (cameFrom.has(u)) {
        path.unshift(cameFrom.get(u).node);
        u = cameFrom.get(u).prev;
      }
      path.unshift(origin);
      path.push(destination);
      return path;
    }

    // neighbors: for demo, use all graphNodes (replace with adjacency list if available)
    for (const neighbor of graphNodes) {
      if (isDanger(neighbor, dangerZones)) continue; // skip danger zones

      const tentativeG =
        gScore.get(key(current)) + haversineDistance(current, neighbor);
      if (tentativeG < (gScore.get(key(neighbor)) || Infinity)) {
        cameFrom.set(key(neighbor), { node: current, prev: key(current) });
        gScore.set(key(neighbor), tentativeG);
        fScore.set(
          key(neighbor),
          tentativeG + haversineDistance(neighbor, destination),
        );
        if (!openSet.find((n) => key(n) === key(neighbor))) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return []; // no path found
}

// Main function: get safe route
async function getSafeRoute(origin, destination, graphNodes) {
  const dangerZones = await getDangerZones();

  // Step 1: compute normal path
  let path = aStar(origin, destination, graphNodes);

  // Step 2: check if path intersects danger zones
  const intersects = path.some((node) => isDanger(node, dangerZones));

  if (!intersects) {
    return { path, alternative: false };
  }

  // Step 3: compute alternative path avoiding danger zones
  let safePath = aStar(origin, destination, graphNodes, dangerZones);

  return { path: safePath, alternative: true };
}

module.exports = { getSafeRoute };
