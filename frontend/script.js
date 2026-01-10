let currentPage = 1;
const recordsPerPage = 5;

let isAscending = true;
let studentsData = [];

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

    fetch("http://localhost:3000/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, course })
    })
    .then(res => res.text())
    .then(data => {
        showAlert(data, "success");
        loadStudents();

        // Clear form
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("course").value = "";
    });
}

/* ---------- LOAD STUDENTS ---------- */
function loadStudents() {
    fetch("http://localhost:3000/students")
    .then(res => res.json())
    .then(data => {
        studentsData = data;
        currentPage = 1;
        displayStudents(data);
    });
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

    showAlert("Editing student ID: " + id, "success");
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

    if (name === "" || email === "" || course === "") {
        showAlert("All fields are required", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showAlert("Invalid email format", "error");
        return;
    }

    fetch(`http://localhost:3000/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, course })
    })
    .then(res => res.text())
    .then(data => {
        showAlert(data, "success");
        document.getElementById("selectedId").value = "";
        loadStudents();
    });
}

/* ---------- DELETE STUDENT ---------- */
function deleteStudent(id) {
    const confirmDelete = confirm("Are you sure you want to delete this student?");

    if (!confirmDelete) return;

    fetch(`http://localhost:3000/delete/${id}`, {
        method: "DELETE"
    })
    .then(res => res.text())
    .then(data => {
        showAlert(data, "success");
        loadStudents();
    });
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


function toggleTheme() {
    document.body.classList.toggle("dark");

    const btn = document.getElementById("themeToggle");
    if (document.body.classList.contains("dark")) {
        btn.innerText = "☀ Light Mode";
    } else {
        btn.innerText = "🌙 Dark Mode";
    }
}

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
