let currentPage = 1;
const recordsPerPage = 5;

let isAscending = true;
let studentsData = [];

/* =====================================================
   🔴 ORIGINAL BACKEND VERSION (COMMENTED – DO NOT DELETE)
=====================================================

fetch("http://localhost:3000/add-student", {...})
fetch("http://localhost:3000/students")
fetch(`http://localhost:3000/update/${id}`)
fetch(`http://localhost:3000/delete/${id}`)

Uncomment later when backend is deployed.

===================================================== */


/* =====================================================
   🟢 PORTFOLIO DEMO VERSION (localStorage FAKE DB)
===================================================== */


/* ---------- ALERT FUNCTION ---------- */
function showAlert(message, type) {
    const alertBox = document.getElementById("alert");

    alertBox.className = "";
    alertBox.classList.add(type === "success" ? "alert-success" : "alert-error");
    alertBox.innerText = message;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 2000);
}

/* ---------- EMAIL VALIDATION ---------- */
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/* ---------- LOAD STUDENTS (Fake DB) ---------- */
function loadStudents() {
    studentsData = JSON.parse(localStorage.getItem("students")) || [];
    currentPage = 1;
    displayStudents(studentsData);
}

/* ---------- ADD STUDENT ---------- */
function addStudent() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const course = document.getElementById("course").value.trim();

    if (name === "" || email === "" || course === "") {
        showAlert("All fields are required", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showAlert("Please enter a valid email address", "error");
        return;
    }

    const students = JSON.parse(localStorage.getItem("students")) || [];

    const newStudent = {
        id: Date.now(),
        name,
        email,
        course
    };

    students.push(newStudent);
    localStorage.setItem("students", JSON.stringify(students));

    showAlert("Student added successfully", "success");

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("course").value = "";

    loadStudents();
}

/* ---------- DISPLAY STUDENTS ---------- */
function displayStudents(data) {
    const list = document.getElementById("list");
    const pageInfo = document.getElementById("pageInfo");
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<li>No students found</li>";
        pageInfo.innerText = "";
        return;
    }

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedData = data.slice(start, end);

    paginatedData.forEach(s => {
        list.innerHTML += `
            <li>
                ${s.name} | ${s.email} | ${s.course}
                <div>
                    <button onclick="editStudent(${s.id}, '${s.name}', '${s.email}', '${s.course}')">Edit</button>
                    <button onclick="deleteStudent(${s.id})">Delete</button>
                </div>
            </li>
        `;
    });

    const totalPages = Math.ceil(data.length / recordsPerPage);
    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
}

function nextPage() {
    const totalPages = Math.ceil(studentsData.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayStudents(studentsData);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayStudents(studentsData);
    }
}

/* ---------- EDIT STUDENT ---------- */
function editStudent(id, name, email, course) {
    document.getElementById("selectedId").value = id;
    document.getElementById("name").value = name;
    document.getElementById("email").value = email;
    document.getElementById("course").value = course;

    showAlert("Editing student", "success");
}

/* ---------- UPDATE STUDENT ---------- */
function updateStudent() {
    const id = document.getElementById("selectedId").value;
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const course = document.getElementById("course").value.trim();

    if (!id) {
        showAlert("Please select a student to edit", "error");
        return;
    }

    let students = JSON.parse(localStorage.getItem("students")) || [];

    students = students.map(s => {
        if (s.id == id) {
            return { ...s, name, email, course };
        }
        return s;
    });

    localStorage.setItem("students", JSON.stringify(students));
    document.getElementById("selectedId").value = "";

    showAlert("Student updated", "success");
    loadStudents();
}

/* ---------- DELETE STUDENT ---------- */
function deleteStudent(id) {
    const confirmDelete = confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    let students = JSON.parse(localStorage.getItem("students")) || [];
    students = students.filter(s => s.id !== id);

    localStorage.setItem("students", JSON.stringify(students));

    showAlert("Student deleted", "success");
    loadStudents();
}

/* ---------- SEARCH STUDENTS ---------- */
function searchStudents() {
    const keyword = document.getElementById("search").value.toLowerCase();

    const filtered = studentsData.filter(s =>
        s.name.toLowerCase().includes(keyword) ||
        s.email.toLowerCase().includes(keyword) ||
        s.course.toLowerCase().includes(keyword)
    );

    currentPage = 1;
    displayStudents(filtered);
}

/* ---------- THEME ---------- */
function toggleTheme() {
    document.body.classList.toggle("dark");

    const btn = document.getElementById("themeToggle");
    btn.innerText = document.body.classList.contains("dark")
        ? "☀ Light Mode"
        : "🌙 Dark Mode";
}

/* ---------- SORT ---------- */
function toggleSort() {
    let sortedData = [...studentsData];

    if (isAscending) {
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        document.getElementById("sortBtn").innerText = "Sort Z–A";
    } else {
        sortedData.sort((a, b) => b.name.localeCompare(a.name));
        document.getElementById("sortBtn").innerText = "Sort A–Z";
    }

    isAscending = !isAscending;
    displayStudents(sortedData);
}

/* ---------- INITIAL LOAD ---------- */
loadStudents();
