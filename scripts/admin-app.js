class AdminApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        // Check authentication
        if (!AuthService.requireAuth()) return;

        this.setupEventListeners();
        this.loadUserInfo();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Sidebar menu clicks
        document.getElementById('sidebarMenu').addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const tab = menuItem.dataset.tab;
                this.switchTab(tab);
            }
        });

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const actionBtn = e.target.closest('.action-btn');
                const tab = actionBtn.dataset.tab;
                this.switchTab(tab);
            }
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Yakin ingin logout?')) {
                AuthService.logout();
                window.location.href = 'login.html';
            }
        });
    }

    loadUserInfo() {
        const user = AuthService.getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.username;
        }
    }

    async loadDashboardData() {
        this.showLoading();
        
        try {
            const stats = await ApiService.getRealTimeStatistics();
            if (stats.success) {
                this.updateDashboardStats(stats.data);
            } else {
                console.error('Failed to load stats:', stats.error);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateDashboardStats(data) {
        document.getElementById('totalBooks').textContent = data.total_books || 0;
        document.getElementById('totalMembers').textContent = data.total_members || 0;
        document.getElementById('activeLoans').textContent = data.active_loans || 0;
        document.getElementById('availableBooks').textContent = data.available_exemplars || 0;
    }

    switchTab(tabName) {
        // Update menu active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show selected tab content
        const targetTab = document.getElementById(`${tabName}-content`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        this.currentTab = tabName;
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminApp();
});