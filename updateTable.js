const db = require("./database.js");

async function updateUserTable() {
  console.log("updating table");
  try {
    const res = await db.query(
      "ALTER TABLE user_data \
      ADD COLUMN feedback TEXT;"
    );
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}



async function updateTable() {
  await updateUserTable();

  db.end();
}

updateTable();

module.exports = db;
