let studentsData = [];
let currentPage = 1;
const recordsPerPage = 8;
let sortField = null;
let sortAsc = true;
let selectedIds = new Set();
let pendingCallback = null;

const API = '';

/* ─── SIDEBAR TOGGLE (mobile) ─── */
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('show-nav');
}

/* ─── TAB NAVIGATION ─── */
function showTab(tab, skipReset) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`.nav-item[onclick*="'${tab}'"]`).classList.add('active');

    const titles = { dashboard: 'Dashboard', students: 'Students', add: 'Add Student' };
    document.getElementById('pageTitle').innerHTML = tab === 'dashboard' ? '<i class="fas fa-chart-pie"></i> Dashboard' : tab === 'students' ? '<i class="fas fa-users"></i> Students' : '<i class="fas fa-user-plus"></i> Add Student';

    const existing = document.getElementById('backBtn');
    if (tab === 'dashboard') {
        if (existing) existing.remove();
    } else if (!existing) {
        const btn = document.createElement('button');
        btn.id = 'backBtn';
        btn.className = 'btn-icon back-btn';
        btn.onclick = goBack;
        btn.title = 'Back to Dashboard';
        btn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        document.getElementById('topbarLeft').prepend(btn);
    }

    if (tab === 'add' && !skipReset) resetForm();
    if (tab === 'dashboard') updateDashboard();
    if (tab === 'students') renderTable();
}

/* ─── BACK / STAT CARD NAVIGATION ─── */
function goBack() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCourse').value = '';
    showTab('dashboard');
}

function goToStudents(filter, value) {
    showTab('students');
    if (filter === 'status') {
        document.getElementById('filterStatus').value = value;
    }
    filterStudents();
    document.querySelector('.sidebar').classList.remove('show-nav');
}

/* ─── TOAST ─── */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast');
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-times-circle"></i>', info: '<i class="fas fa-info-circle"></i>' };
    const item = document.createElement('div');
    item.className = `toast-item toast-${type}`;
    item.innerHTML = `${icons[type] || ''} ${message}`;
    container.appendChild(item);
    setTimeout(() => {
        item.classList.add('removing');
        setTimeout(() => item.remove(), 300);
    }, 3000);
}

/* ─── CONFIRM MODAL ─── */
function showModal(message, callback, title = 'Confirm', btnText = 'Delete') {
    document.getElementById('modalTitle').innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
    document.getElementById('modalMessage').innerHTML = message;
    document.getElementById('modalConfirmBtn').innerHTML = `<i class="fas fa-trash"></i> ${btnText}`;
    document.getElementById('modalOverlay').classList.add('active');
    pendingCallback = callback;
}

function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modalOverlay').classList.remove('active');
    pendingCallback = null;
}

function modalConfirm() {
    if (pendingCallback) pendingCallback();
    closeModal();
}

/* ─── DETAIL MODAL ─── */
function showDetail(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) return;
    document.getElementById('detailModalTitle').textContent = student.name;
    const body = document.getElementById('detailModalBody');
    body.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${esc(student.email)}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${esc(student.phone || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Course</span><span class="detail-value">${esc(student.course)}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge status-${student.status}">${student.status}</span></span></div>
            <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">${esc(student.gender || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">DOB</span><span class="detail-value">${student.dob ? formatDate(student.dob) : '-'}</span></div>
            <div class="detail-item"><span class="detail-label">Enrolled</span><span class="detail-value">${student.enrollmentDate ? formatDate(student.enrollmentDate) : '-'}</span></div>
            <div class="detail-item"><span class="detail-label">Address</span><span class="detail-value">${esc(student.address || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${student.createdAt ? formatDate(student.createdAt) : '-'}</span></div>
        </div>
    `;
    document.getElementById('detailModalOverlay').classList.add('active');
}

function closeDetailModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('detailModalOverlay').classList.remove('active');
}

/* ─── HELPERS ─── */
function esc(s) { return String(s).replace(/[&<>"]/g, function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]; }); }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

/* ─── API ─── */
async function apiGet(url) {
    const r = await fetch(`${API}${url}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

async function apiPost(url, body) {
    const r = await fetch(`${API}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

async function apiPut(url, body) {
    const r = await fetch(`${API}${url}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

async function apiDel(url) {
    const r = await fetch(`${API}${url}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

/* ─── CORE DATA ─── */
async function loadStudents() {
    try {
        studentsData = await apiGet('/students');
        studentsData.forEach(s => { if (s.id !== undefined) s.id = Number(s.id); });
    } catch (e) {
        console.error('Failed to load students:', e);
        showToast('Failed to load students from server', 'error');
        studentsData = [];
    }
    currentPage = 1;
    selectedIds.clear();
    updateUI();
}

function updateUI() {
    updateHeaderCount();
    updateDashboard();
    renderTable();
    updateFilterOptions();
}

function updateHeaderCount() {
    document.getElementById('headerCount').innerHTML = `<i class="fas fa-user-graduate"></i> ${studentsData.length} student${studentsData.length !== 1 ? 's' : ''}`;
}

/* ─── DASHBOARD ─── */
function updateDashboard() {
    const total = studentsData.length;
    const active = studentsData.filter(s => s.status === 'Active').length;
    const inactive = studentsData.filter(s => s.status === 'Inactive').length;
    const graduated = studentsData.filter(s => s.status === 'Graduated').length;
    const courses = new Set(studentsData.map(s => s.course)).size;
    const males = studentsData.filter(s => s.gender === 'Male').length;
    const females = studentsData.filter(s => s.gender === 'Female').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statInactive').textContent = inactive;
    document.getElementById('statGraduated').textContent = graduated;
    document.getElementById('statCourses').textContent = courses;
    document.getElementById('statGenderM').textContent = males;
    document.getElementById('statGenderF').textContent = females;

    const recent = [...studentsData].reverse().slice(0, 5);
    const container = document.getElementById('recentList');
    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">No students yet. Start by adding one!</p>';
    } else {
        container.innerHTML = recent.map(s => `
            <div class="recent-student-item">
                <div class="student-avatar" style="background:${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
                <div class="recent-info">
                    <div class="recent-name">${esc(s.name)}</div>
                    <div class="recent-meta">${esc(s.course)} &middot; <span class="status-badge status-${s.status}">${s.status}</span></div>
                </div>
            </div>
        `).join('');
    }
}

/* ─── FILTER OPTIONS ─── */
function updateFilterOptions() {
    const courses = [...new Set(studentsData.map(s => s.course))];
    const select = document.getElementById('filterCourse');
    const currentVal = select.value;
    select.innerHTML = '<option value="">All Courses</option>' + courses.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    select.value = currentVal;
}

function filterStudents() {
    currentPage = 1;
    renderTable();
}

function getFilteredData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    const course = document.getElementById('filterCourse').value;
    const status = document.getElementById('filterStatus').value;

    let data = studentsData.filter(s => {
        if (keyword && !s.name.toLowerCase().includes(keyword) && !s.email.toLowerCase().includes(keyword) && !s.course.toLowerCase().includes(keyword)) return false;
        if (course && s.course !== course) return false;
        if (status && s.status !== status) return false;
        return true;
    });

    if (sortField) {
        data.sort((a, b) => {
            let va = (a[sortField] || '').toString().toLowerCase();
            let vb = (b[sortField] || '').toString().toLowerCase();
            if (va < vb) return sortAsc ? -1 : 1;
            if (va > vb) return sortAsc ? 1 : -1;
            return 0;
        });
    }

    return data;
}

function sortBy(field) {
    if (sortField === field) {
        sortAsc = !sortAsc;
    } else {
        sortField = field;
        sortAsc = true;
    }
    renderTable();
}

/* ─── RENDER TABLE ─── */
function renderTable() {
    const data = getFilteredData();
    const totalPages = Math.ceil(data.length / recordsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * recordsPerPage;
    const pageData = data.slice(start, start + recordsPerPage);

    const tbody = document.getElementById('studentTableBody');
    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">No students found</div></td></tr>`;
    } else {
        tbody.innerHTML = pageData.map(s => {
            const checked = selectedIds.has(s.id) ? 'checked' : '';
            return `
                <tr>
                    <td><input type="checkbox" class="student-check" value="${s.id}" ${checked} onchange="toggleSelect(${s.id})"></td>
                    <td>
                        <div class="student-name-cell">
                            <div class="student-avatar" style="background:${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
                            <span class="name-text">${esc(s.name)}</span>
                        </div>
                    </td>
                    <td>${esc(s.email)}</td>
                    <td>${esc(s.course)}</td>
                    <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                    <td>${s.enrollmentDate ? formatDate(s.enrollmentDate) : '-'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="showDetail(${s.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editStudent(${s.id})" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="btn-del" onclick="confirmDelete(${s.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    document.getElementById('pageInfo').innerHTML = `<i class="fas fa-file"></i> Page ${currentPage} of ${totalPages}`;
    document.getElementById('selectAll').checked = pageData.length > 0 && pageData.every(s => selectedIds.has(s.id));
    updateBulkDeleteBtn();
}

function nextPage() {
    const data = getFilteredData();
    const totalPages = Math.ceil(data.length / recordsPerPage) || 1;
    if (currentPage < totalPages) { currentPage++; renderTable(); }
}

function prevPage() {
    if (currentPage > 1) { currentPage--; renderTable(); }
}

/* ─── SELECTION ─── */
function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    updateBulkDeleteBtn();
    const checks = document.querySelectorAll('.student-check');
    const checked = document.querySelectorAll('.student-check:checked');
    document.getElementById('selectAll').checked = checks.length > 0 && checked.length === checks.length;
}

function toggleSelectAll() {
    const checked = document.getElementById('selectAll').checked;
    const pageData = getFilteredData().slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
    pageData.forEach(s => {
        if (checked) selectedIds.add(s.id);
        else selectedIds.delete(s.id);
    });
    renderTable();
}

function updateBulkDeleteBtn() {
    const btn = document.getElementById('bulkDeleteBtn');
    btn.disabled = selectedIds.size === 0;
    btn.innerHTML = selectedIds.size > 0 ? `<i class="fas fa-trash"></i> Delete (${selectedIds.size})` : `<i class="fas fa-trash"></i> Delete Selected`;
}

/* ─── CRUD ─── */
async function addStudent() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const course = document.getElementById('course').value.trim();
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const enrollmentDate = document.getElementById('enrollmentDate').value;
    const status = document.getElementById('status').value;
    const address = document.getElementById('address').value.trim();
    const editId = document.getElementById('selectedId').value;

    if (!name || !email || !course) {
        showToast('Name, email, and course are required', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    const payload = { name, email, phone, course, gender, dob: dob || null, enrollmentDate: enrollmentDate || null, status, address };

    try {
        if (editId) {
            await apiPut(`/update/${editId}`, payload);
            showToast('Student updated successfully', 'success');
        } else {
            await apiPost('/add-student', payload);
            showToast('Student added successfully', 'success');
        }
        resetForm();
        await loadStudents();
        showTab('students');
    } catch (e) {
        showToast('Operation failed: ' + e.message, 'error');
    }
}

function editStudent(id) {
    const s = studentsData.find(st => st.id === id);
    if (!s) return;

    document.getElementById('selectedId').value = s.id;
    document.getElementById('name').value = s.name;
    document.getElementById('email').value = s.email;
    document.getElementById('phone').value = s.phone || '';
    document.getElementById('course').value = s.course;
    document.getElementById('gender').value = s.gender || '';
    document.getElementById('dob').value = s.dob ? s.dob.split('T')[0] : '';
    document.getElementById('enrollmentDate').value = s.enrollmentDate ? s.enrollmentDate.split('T')[0] : '';
    document.getElementById('status').value = s.status || 'Active';
    document.getElementById('address').value = s.address || '';
    document.getElementById('formTitle').textContent = 'Edit Student';
    document.getElementById('formSubmitBtn').textContent = 'Update Student';
    showTab('add', true);
}

function resetForm() {
    document.getElementById('selectedId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('course').value = '';
    document.getElementById('gender').value = '';
    document.getElementById('dob').value = '';
    document.getElementById('enrollmentDate').value = '';
    document.getElementById('status').value = 'Active';
    document.getElementById('address').value = '';
    document.getElementById('formTitle').textContent = 'Add New Student';
    document.getElementById('formSubmitBtn').textContent = 'Add Student';
}

function confirmDelete(id) {
    const s = studentsData.find(st => st.id === id);
    showModal(
        `Are you sure you want to delete <strong>${esc(s ? s.name : 'this student')}</strong>? This cannot be undone.`,
        () => { deleteStudent(id); },
        'Confirm Deletion',
        'Delete'
    );
}

async function deleteStudent(id) {
    try {
        await apiDel(`/delete/${id}`);
        showToast('Student deleted', 'success');
        selectedIds.delete(id);
        await loadStudents();
    } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
    }
}

async function bulkDelete() {
    if (selectedIds.size === 0) return;
    showModal(
        `Delete <strong>${selectedIds.size} student${selectedIds.size > 1 ? 's' : ''}</strong>? This cannot be undone.`,
        async () => {
            try {
                const ids = [...selectedIds];
                await Promise.all(ids.map(id => apiDel(`/delete/${id}`)));
                selectedIds.clear();
                showToast('Students deleted successfully', 'success');
                await loadStudents();
            } catch (e) {
                showToast('Bulk delete failed: ' + e.message, 'error');
            }
        },
        'Confirm Bulk Deletion',
        'Delete All'
    );
}

/* ─── EXPORT CSV ─── */
function exportCSV() {
    if (studentsData.length === 0) {
        showToast('No students to export', 'error');
        return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Course', 'Gender', 'DOB', 'Enrollment Date', 'Status', 'Address'];
    const rows = studentsData.map(s => [
        `"${esc(s.name)}"`, `"${esc(s.email)}"`, `"${esc(s.phone || '')}"`, `"${esc(s.course)}"`, `"${esc(s.gender || '')}"`,
        `"${s.dob || ''}"`, `"${s.enrollmentDate || ''}"`, `"${s.status}"`, `"${esc(s.address || '')}"`
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('CSV exported successfully', 'success');
}

/* ─── THEME ─── */
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i> Light';
    }
}

/* ─── KEYBOARD SHORTCUTS ─── */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('detailModalOverlay').classList.contains('active')) closeDetailModal();
        else if (document.getElementById('modalOverlay').classList.contains('active')) closeModal();
    }
    if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') showTab('dashboard');
        if (e.key === '2') showTab('students');
        if (e.key === '3') showTab('add');
    }
});

/* ─── INIT ─── */
initTheme();
loadStudents();
