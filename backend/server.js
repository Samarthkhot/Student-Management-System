const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();

// 🔹 For deployment (uncomment when deploying)
// const PORT = process.env.PORT || 3000;

// 🔹 For local development
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Get all students
app.get("/students", (req, res) => {
  db.query("SELECT * FROM students", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(result);
  });
});

// Add student
app.post("/add-student", (req, res) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO students (name, email, course) VALUES (?, ?, ?)";
  db.query(sql, [name, email, course], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Insert failed" });
    }
    res.status(201).json({ message: "Student added successfully" });
  });
});

// Delete student
app.delete("/delete/:id", (req, res) => {
  db.query("DELETE FROM students WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.status(200).json({ message: "Student deleted" });
  });
});

// Update student
app.put("/update/:id", (req, res) => {
  const { name, email, course } = req.body;

  const sql =
    "UPDATE students SET name=?, email=?, course=? WHERE id=?";
  db.query(sql, [name, email, course, req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Update failed" });
    }
    res.status(200).json({ message: "Student updated" });
  });
});

// 🔹 Fallback route (needed for deployment only)
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
