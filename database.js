

const { query } = require("express");
const pg = require("pg");
const { Pool } = pg;
const pool = new Pool({
  user: "myuser",
  password: "mypassword",
  host: "localhost",
  port: 5432,
  database: "map_data",
});
module.exports = pool;



