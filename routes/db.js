const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root2006",
  database: "hospital_db",
});

connection.connect((err) => {
  if (err) {
    console.log("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected Successfully");
  }
});

module.exports = connection;