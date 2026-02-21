

const db = require("./database.js");

async function createWaterloggingTable() {
  console.log("creating waterlogging_reports table");
  try {
    const res = await db.query(
      "CREATE TABLE IF NOT EXISTS waterlogging_reports (\
                id SERIAL PRIMARY KEY,\
                latitude DOUBLE PRECISION NOT NULL,\
                longitude DOUBLE PRECISION NOT NULL,\
                severity VARCHAR(255) CHECK (severity IN ('safe','mild','heavy','manhole_open','very_mudded')) NOT NULL,\
                description TEXT,\
                date_reported DATE NOT NULL DEFAULT CURRENT_DATE,\
                likes INTEGER DEFAULT 0,\
                verifications INTEGER DEFAULT 0,\
                disapprovals INTEGER DEFAULT 0\
            );"
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}




async function createUserTable() {
  console.log("creating user_data table");
  try {
    const res = await db.query(
      "CREATE TABLE IF NOT EXISTS user_data (\
        id SERIAL PRIMARY KEY,\
        email VARCHAR(255) UNIQUE NOT NULL,\
        password VARCHAR(255) NOT NULL,\
        role VARCHAR(20) DEFAULT 'user'\
      );",
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}







async function createHistoryTable() {
  console.log("creating history table");
  try {
    const res = await db.query(
      "CREATE TABLE IF NOT EXISTS history (\
                id SERIAL PRIMARY KEY,\
                user_id INTEGER NOT NULL,\
                current_latitude DOUBLE PRECISION NOT NULL,\
                current_longitude DOUBLE PRECISION NOT NULL,\
                destination_latitude DOUBLE PRECISION NOT NULL,\
                destination_longitude DOUBLE PRECISION NOT NULL,\
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\
                FOREIGN KEY (user_id) REFERENCES user_data(id)\
            );"
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}


async function createReportFeedbackTable() {
  console.log("creating report_feedback table");
  try {
    const res = await db.query(
      "CREATE TABLE IF NOT EXISTS report_feedback (\
        id SERIAL PRIMARY KEY,\
        user_id INT REFERENCES user_data(id),\
        report_id INT REFERENCES waterlogging_reports(id),\
        type VARCHAR(20) CHECK (type IN ('like','verify','disapprove')) NOT NULL,\
        UNIQUE (user_id, report_id)\
      );"
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}



async function createFavouriteTable() {
  console.log("creating favourite table");
  try {
    const res = await db.query(
      "CREATE TABLE IF NOT EXISTS favourite (\
                id SERIAL PRIMARY KEY,\
                user_id INTEGER NOT NULL,\
                current_latitude DOUBLE PRECISION NOT NULL,\
                current_longitude DOUBLE PRECISION NOT NULL,\
                destination_latitude DOUBLE PRECISION NOT NULL,\
                destination_longitude DOUBLE PRECISION NOT NULL,\
                FOREIGN KEY (user_id) REFERENCES user_data(id)\
            );"
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}



async function createWaterloggingAreaReportsTable() {
  const query = ` CREATE TABLE IF NOT EXISTS waterlogging_area_reports ( id SERIAL PRIMARY KEY, severity TEXT NOT NULL, description TEXT, date_reported DATE NOT NULL, geom geometry(Polygon, 4326) ); `;
  try {
    await db.query(query);
    console.log("✅ Table 'waterlogging_area_reports' created successfully");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
}







async function createTables() {
  await createUserTable();
  await createWaterloggingTable(); // ✅ new table for waterlogging reports
  await createHistoryTable();
  await createFavouriteTable();
  await createReportFeedbackTable();
  await createWaterloggingAreaReportsTable(); // ✅ new table for area reports
  db.end();
}

createTables();

module.exports = db;



