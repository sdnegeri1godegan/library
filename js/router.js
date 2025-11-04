// 🧭 SPA ROUTER
class Router {
    constructor() {
        this.routes = {
            home: 'homeView',
            opac: 'opacView', 
            status: 'statusView',
            login: 'loginView'
        };
        this.currentView = 'home';
        this.init();
    }

    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange();
        });

        // Handle nav link clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.navigate(view);
            });
        });

        // Initial route
        this.handleRouteChange();
    }

    navigate(view) {
        if (this.routes[view]) {
            history.pushState({ view }, '', `#${view}`);
            this.showView(view);
        }
    }

    handleRouteChange() {
        const hash = window.location.hash.replace('#', '') || 'home';
        this.showView(hash);
    }

    showView(view) {
        // Hide all views
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show current view
        const viewElement = document.getElementById(this.routes[view]);
        if (viewElement) {
            viewElement.classList.add('active');
            
            // Add active class to current nav link
            const activeLink = document.querySelector(`[data-view="${view}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            this.currentView = view;

            // Load view-specific data
            this.loadViewData(view);
        }
    }

    loadViewData(view) {
        switch(view) {
            case 'home':
                app.loadHomeData();
                break;
            case 'opac':
                app.loadOPACData();
                break;
            case 'status':
                // Clear previous status results
                document.getElementById('statusResults').innerHTML = 
                    '<div class="status-placeholder"><p>Masukkan NIS siswa untuk melihat status peminjaman</p></div>';
                break;
            case 'login':
                // Clear login form
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                document.getElementById('loginMessage').innerHTML = '';
                break;
        }
    }
}

// Initialize router
const router = new Router();