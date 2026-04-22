document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// --- State ---
let token = localStorage.getItem('adminToken');

// --- Auth ---
function checkAuth() {
    if (token) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        loadAllData();
    } else {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok && data.token) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            checkAuth();
        } else {
            errorMsg.textContent = data.error || 'Login failed';
        }
    } catch (err) {
        errorMsg.textContent = 'Server error. Try again.';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    token = null;
    checkAuth();
});

// --- Navigation ---
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            
            li.classList.add('active');
            document.getElementById(li.getAttribute('data-target')).classList.add('active');
        });
    });

    // Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        });
    });

    // Project Form
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        document.getElementById('projectForm').reset();
        document.getElementById('projectId').value = '';
        document.getElementById('projectModalTitle').textContent = 'Add Project';
        document.getElementById('projectModal').classList.remove('hidden');
    });

    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    
    // Image Upload
    document.getElementById('projectImageFile').addEventListener('change', uploadImage);

    // Skill Form
    document.getElementById('addSkillBtn').addEventListener('click', () => {
        document.getElementById('skillForm').reset();
        document.getElementById('skillModal').classList.remove('hidden');
    });

    document.getElementById('skillForm').addEventListener('submit', handleSkillSubmit);

    // About Form
    document.getElementById('aboutForm').addEventListener('submit', handleAboutSubmit);
}

// --- API Helpers ---
const authHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
});

// --- Data Loading ---
async function loadAllData() {
    await fetchProjects();
    await fetchSkills();
    await fetchAbout();
    await fetchMessages();
}

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        document.getElementById('stat-projects').textContent = projects.length;
        
        const tbody = document.getElementById('projectsTableBody');
        tbody.innerHTML = projects.map(p => `
            <tr>
                <td><img src="${p.image_url || 'https://via.placeholder.com/60'}" alt="${p.title}"></td>
                <td>${p.title}</td>
                <td><a href="${p.link || '#'}" target="_blank">Link</a></td>
                <td class="action-btns">
                    <button class="btn btn-edit" onclick="editProject(${p.id}, '${p.title.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', '${p.image_url}', '${p.link}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" onclick="deleteProject(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error('Error fetching projects', err); }
}

async function fetchSkills() {
    try {
        const res = await fetch('/api/skills');
        const skills = await res.json();
        document.getElementById('stat-skills').textContent = skills.length;
        
        const tbody = document.getElementById('skillsTableBody');
        tbody.innerHTML = skills.map(s => `
            <tr>
                <td><i class="${s.icon || 'fas fa-star'}"></i></td>
                <td>${s.title}</td>
                <td>${s.description}</td>
                <td class="action-btns">
                    <button class="btn btn-danger" onclick="deleteSkill(${s.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error('Error fetching skills', err); }
}

async function fetchAbout() {
    try {
        const res = await fetch('/api/about');
        const data = await res.json();
        if (data && data.content) {
            document.getElementById('aboutContent').value = data.content;
        }
    } catch (err) { console.error('Error fetching about', err); }
}

async function fetchMessages() {
    try {
        const res = await fetch('/api/messages', { headers: authHeaders() });
        if(res.status === 401 || res.status === 403) return; // Ignore if unauthorized
        const messages = await res.json();
        document.getElementById('stat-messages').textContent = messages.length;
        
        const container = document.getElementById('messagesContainer');
        container.innerHTML = messages.map(m => `
            <div class="message-card">
                <h4>${m.name}</h4>
                <div class="meta">${m.email} | ${new Date(m.created_at).toLocaleString()}</div>
                <p>${m.message}</p>
                <button class="btn btn-danger" style="margin-top:1rem" onclick="deleteMessage(${m.id})"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `).join('');
    } catch (err) { console.error('Error fetching messages', err); }
}

// --- CRUD Operations ---
async function handleProjectSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDesc').value;
    const link = document.getElementById('projectLink').value;
    const image_url = document.getElementById('projectImageUrl').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/projects/${id}` : '/api/projects';

    try {
        const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify({ title, description, link, image_url })
        });
        if (res.ok) {
            document.getElementById('projectModal').classList.add('hidden');
            fetchProjects();
        } else { alert('Failed to save project'); }
    } catch (err) { alert('Error saving project'); }
}

window.editProject = (id, title, desc, img, link) => {
    document.getElementById('projectId').value = id;
    document.getElementById('projectTitle').value = title;
    document.getElementById('projectDesc').value = desc;
    document.getElementById('projectLink').value = link || '';
    document.getElementById('projectImageUrl').value = img || '';
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectModal').classList.remove('hidden');
}

window.deleteProject = async (id) => {
    if(confirm('Are you sure you want to delete this project?')) {
        try {
            await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: authHeaders() });
            fetchProjects();
        } catch (err) { alert('Error deleting project'); }
    }
}

async function handleSkillSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('skillTitle').value;
    const description = document.getElementById('skillDesc').value;
    const icon = document.getElementById('skillIcon').value;

    try {
        const res = await fetch('/api/skills', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ title, description, icon })
        });
        if (res.ok) {
            document.getElementById('skillModal').classList.add('hidden');
            fetchSkills();
        }
    } catch (err) { alert('Error saving skill'); }
}

window.deleteSkill = async (id) => {
    if(confirm('Delete this skill?')) {
        try {
            await fetch(`/api/skills/${id}`, { method: 'DELETE', headers: authHeaders() });
            fetchSkills();
        } catch (err) { alert('Error deleting skill'); }
    }
}

async function handleAboutSubmit(e) {
    e.preventDefault();
    const content = document.getElementById('aboutContent').value;
    try {
        const res = await fetch('/api/about', {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ content })
        });
        if (res.ok) alert('About section updated!');
    } catch (err) { alert('Error updating about section'); }
}

window.deleteMessage = async (id) => {
    if(confirm('Delete this message?')) {
        try {
            await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: authHeaders() });
            fetchMessages();
        } catch (err) { alert('Error deleting message'); }
    }
}

// --- Image Upload ---
async function uploadImage() {
    const fileInput = document.getElementById('projectImageFile');
    const status = document.getElementById('uploadStatus');
    
    if (fileInput.files.length === 0) return;
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    status.textContent = 'Uploading...';
    status.style.color = 'var(--text-light)';
    
    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type for FormData, the browser handles it (with boundaries)
            },
            body: formData
        });
        
        const data = await res.json();
        
        if (res.ok && data.fileUrl) {
            document.getElementById('projectImageUrl').value = data.fileUrl;
            status.textContent = 'Upload successful!';
            status.style.color = 'var(--secondary)';
        } else {
            status.textContent = data.error || 'Upload failed.';
            status.style.color = 'var(--danger)';
        }
    } catch (err) {
        status.textContent = 'Error uploading file.';
        status.style.color = 'var(--danger)';
    }
}
