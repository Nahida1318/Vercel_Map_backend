// var map = L.map('map')

// navigator.geolocation.getCurrentPosition((position) => {

//     const lat = position.coords.latitude
//     const lng = position.coords.longitude
//     const accuracy = position.coords.accuracy

//     map.setView([lat,lng], 19);


// }, (error) => {
//     console.log(error)
// })

// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(map);



// let marker, circle;

// navigator.geolocation.watchPosition((position) => {

//     const lat = position.coords.latitude
//     const lng = position.coords.longitude
//     const accuracy = position.coords.accuracy
//     console.log(lat,lng,accuracy)

//     if(marker) {
//         map.removeLayer(marker)
//         map.removeLayer(circle)
//     }

//     marker = L.marker([lat, lng]).addTo(map);
//     circle = L.circle([lat, lng], {
//         color: 'red',
//         fillColor: '#f03',
//         fillOpacity: 0.5,
//         radius: accuracy
//     }).addTo(map);


// }, (error) => {

//     console.log(error)
// })



// L.Routing.control({
//     waypoints: [
//         L.latLng(23.7428301,90.4263129),
//         L.latLng(23.794057,90.2910214)
//     ]
// }).addTo(map);






















// Define bounding box for Dhanmondi
const dhanmondiBounds = L.latLngBounds(
  [23.7355, 90.3675], // southwest corner
  [23.7575, 90.3955]  // northeast corner
);

// Initialize map with bounds restriction
var map = L.map('map', {
  center: [23.7465, 90.3780], // center of Dhanmondi
  zoom: 15,
  minZoom: 13,
  maxZoom: 18,
  maxBounds: dhanmondiBounds,
  maxBoundsViscosity: 0.7
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Optional: draw Dhanmondi boundary polygon
const dhanmondiGeoJSON = {
  "type": "Feature",
  "properties": { "name": "Dhanmondi" },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [90.3718, 23.7404],
      [90.3712, 23.7468],
      [90.3722, 23.7524],
      [90.3786, 23.7568],
      [90.3852, 23.7560],
      [90.3920, 23.7522],
      [90.3928, 23.7458],
      [90.3898, 23.7412],
      [90.3835, 23.7392],
      [90.3760, 23.7390],
      [90.3718, 23.7404]
    ]]
  }
};

L.geoJSON(dhanmondiGeoJSON, {
  style: {
    color: '#1f78b4',
    weight: 2,
    fillColor: '#1f78b4',
    fillOpacity: 0.1
  }
}).addTo(map);

// Keep your geolocation marker logic as-is
let marker, circle;
navigator.geolocation.watchPosition((position) => {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy;

  if (marker) {
    map.removeLayer(marker);
    map.removeLayer(circle);
  }

  marker = L.marker([lat, lng]).addTo(map);
  circle = L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: accuracy
  }).addTo(map);

}, (error) => {
  console.log(error);
});



