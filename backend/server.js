const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Test route
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Add student API
app.post("/add-student", (req, res) => {
    const { name, email, course } = req.body;

    const sql = "INSERT INTO students (name, email, course) VALUES (?, ?, ?)";
    db.query(sql, [name, email, course], (err) => {
        if (err) {
            res.send("Error");
        } else {
            res.send("Student added successfully");
        }
    });
});

// Delete student
app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM students WHERE id = ?", [id], (err) => {
        if (err) {
            res.send("Error");
        } else {
            res.send("Student deleted");
        }
    });
});

// Update student
app.put("/update/:id", (req, res) => {
    const id = req.params.id;
    const { name, email, course } = req.body;

    const sql = "UPDATE students SET name=?, email=?, course=? WHERE id=?";
    db.query(sql, [name, email, course, id], (err) => {
        if (err) {
            res.send("Error");
        } else {
            res.send("Student updated");
        }
    });
});


// Get all students
app.get("/students", (req, res) => {
    db.query("SELECT * FROM students", (err, result) => {
        if (err) {
            res.send("Error");
        } else {
            res.send(result);
        }
    });
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
