// Configuration
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxhMOUm3vF7oWk1dK0a1Fz0BphtVoDs8NgaFreFCUV0XYrKibpZvZEicJ14MwzT2MBy/exec', // Ganti dengan Web App URL
    pages: ['dashboard', 'students', 'books', 'transactions', 'reports', 'scan', 'system']
};

// Global State
let currentUser = null;
let currentPage = 'dashboard';

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    app: document.getElementById('app'),
    authModal: document.getElementById('authModal'),
    pageContent: document.getElementById('pageContent'),
    sidebarItems: document.querySelectorAll('.nav-item'),
    mobileToggle: document.querySelector('.mobile-menu-toggle'),
    mobileOverlay: document.getElementById('mobileOverlay'),
    logoutBtn: document.getElementById('logoutBtn'),
    currentUserEl: document.getElementById('currentUser'),
    currentTimeEl: document.getElementById('currentTime')
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
    updateTime();
    setInterval(updateTime, 1000);
});

// App Initialization
async function initApp() {
    showLoading();
    
    try {
        // Check authentication
        const authCheck = await apiCall('checkAuth');
        
        if (authCheck.authenticated) {
            currentUser = authCheck.user;
            hideLoading();
            showApp();
            loadDashboard();
        } else {
            hideLoading();
            showAuthModal();
        }
    } catch (error) {
        console.error('Init error:', error);
        hideLoading();
        showAuthModal();
    }
}

// Show/Hide Loading
function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

// Show/Hide App
function showApp() {
    elements.app.classList.remove('hidden');
    elements.authModal.classList.add('hidden');
}

function showAuthModal() {
    elements.app.classList.add('hidden');
    elements.authModal.classList.remove('hidden');
}

// Navigation
elements.sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
            switchPage(page);
        }
    });
});

// Mobile Menu Toggle
elements.mobileToggle.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
    elements.mobileOverlay.classList.toggle('active');
});

elements.mobileOverlay.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('open');
    elements.mobileOverlay.classList.remove('active');
});

// Logout
elements.logoutBtn.addEventListener('click', async () => {
    const result = await apiCall('logout');
    if (result.success) {
        currentUser = null;
        showAuthModal();
        showToast('Logout berhasil', 'success');
    }
});

// Page Switching
async function switchPage(page) {
    currentPage = page;
    
    // Update active nav
    elements.sidebarItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Close mobile menu
    document.querySelector('.sidebar').classList.remove('open');
    elements.mobileOverlay.classList.remove('active');
    
    // Load page content
    switch (page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'students':
            await loadStudentsPage();
            break;
        case 'books':
            await loadBooksPage();
            break;
        case 'transactions':
            await loadTransactionsPage();
            break;
        case 'reports':
            await loadReportsPage();
            break;
        case 'scan':
            await loadScanPage();
            break;
        case 'system':
            await loadSystemPage();
            break;
    }
}

// API Helper
async function apiCall(action, payload = {}) {
    const requestPayload = {
        action,
        email: currentUser?.user || '',
        ...payload
    };

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load Dashboard
async function loadDashboard() {
    const stats = await apiCall('getStatistics');
    
    elements.pageContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard Perpustakaan
                </h1>
                <button class="btn-primary btn-sm" onclick="refreshDashboard()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.activeStudents || 0}</div>
                    <div class="stat-label">Siswa Aktif</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.activeLoans || 0}</div>
                    <div class="stat-label">Peminjaman Aktif</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.availableExemplars || 0}</div>
                    <div class="stat-label">Buku Tersedia</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">Rp ${((stats.totalFines || 0)/1000).toLocaleString()}</div>
                    <div class="stat-label">Total Denda</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-pie"></i>
                            Kuota Siswa
                        </h3>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${stats.studentQuota?.available > 0 ? '#48bb78' : '#f56565'}">
                            ${stats.studentQuota?.available || 0}
                        </div>
                        <div style="color: #666; margin-top: 0.5rem;">
                            Tersedia / ${stats.studentQuota?.max || 0}
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-clock"></i>
                            Terlambat Hari Ini
                        </h3>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: #f56565;">
                            ${await getOverdueCount()}
                        </div>
                        <div style="color: #666; margin-top: 0.5rem;">
                            Buku Terlambat
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateBadges();
}

// Utility Functions
async function getOverdueCount() {
    const overdue = await apiCall('getOverdueLoans');
    return overdue.length || 0;
}

async function updateBadges() {
    const stats = await apiCall('getStatistics');
    
    document.getElementById('students-badge').textContent = stats.activeStudents || 0;
    document.getElementById('books-badge').textContent = stats.availableExemplars || 0;
    document.getElementById('loans-badge').textContent = stats.activeLoans || 0;
}

function updateTime() {
    const now = new Date();
    elements.currentTimeEl.textContent = now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    elements.currentUserEl.textContent = currentUser ? `Selamat datang, ${currentUser.user}` : '';
}

async function refreshDashboard() {
    showToast('Dashboard diperbarui', 'success');
    await loadDashboard();
}

window.refreshDashboard = refreshDashboard;

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global error handler
window.addEventListener('error', (e) => {
    showToast('Terjadi kesalahan: ' + e.message, 'error');
});