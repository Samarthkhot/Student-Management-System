const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sam123",
    database: "student_db"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL error:", err.message);
        return;
    }
    console.log("MySQL Connected");
});

module.exports = db;

