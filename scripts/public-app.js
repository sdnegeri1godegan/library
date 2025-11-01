class PublicApp {
    constructor() {
        this.currentTab = 'beranda';
        this.searchResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 10;
        
        console.log('=== PUBLIC APP INITIALIZED ===');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.loadInitialData();
        
        // Test API connection
        this.testAPIConnection();
    }

    async testAPIConnection() {
        console.log('Testing API connection...');
        console.log('API URL:', ApiService.BASE_URL);
        
        try {
            // Test statistics endpoint
            const stats = await ApiService.getRealTimeStatistics();
            console.log('Statistics API Response:', stats);
            
            if (stats.success) {
                console.log('✅ API Connection Successful');
            } else {
                console.log('❌ API Connection Failed:', stats.error);
            }
            
        } catch (error) {
            console.error('❌ API Test Failed:', error);
        }
    }

    setupEventListeners() {
        // Tab switching - menggunakan event delegation
        document.addEventListener('click', (e) => {
            // Handle nav item clicks
            if (e.target.closest('.nav-item')) {
                const navItem = e.target.closest('.nav-item');
                const tab = navItem.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
            
            // Handle action card clicks
            if (e.target.closest('.action-card')) {
                const actionCard = e.target.closest('.action-card');
                const tab = actionCard.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
            
            // Handle back button in admin tab
            if (e.target.closest('.back-btn')) {
                this.switchTab('beranda');
            }
        });

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        const mainSearch = document.getElementById('main-search');
        if (mainSearch) {
            mainSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Hero search
        const heroSearchBtn = document.querySelector('.search-btn');
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                const query = document.getElementById('hero-search').value;
                if (query) {
                    this.switchTab('cari');
                    setTimeout(() => {
                        document.getElementById('main-search').value = query;
                        this.performSearch();
                    }, 100);
                }
            });
        }

        // Real-time search with debounce
        this.setupRealTimeSearch();
    }

    setupRealTimeSearch() {
        let timeout;
        const searchInput = document.getElementById('main-search');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (e.target.value.length >= 3 || e.target.value.length === 0) {
                        this.performSearch();
                    }
                }, 500);
            });
        }

        // Auto-apply filters
        document.querySelectorAll('input[type="radio"][name="status"], select').forEach(element => {
            element.addEventListener('change', () => {
                this.performSearch();
            });
        });
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navItems = document.getElementById('navItems');

        if (navToggle && navItems) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navItems.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.navbar')) {
                    navItems.classList.remove('active');
                }
            });

            // Close mobile menu when clicking a nav item
            navItems.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item')) {
                    navItems.classList.remove('active');
                }
            });
        }
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
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
            
            // Load tab data if needed
            this.loadTabData(tabName);
        } else {
            console.error('Tab content not found:', `${tabName}-content`);
        }

        this.currentTab = tabName;
        
        // Scroll to top when switching tabs
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async loadTabData(tabName) {
        console.log('Loading data for tab:', tabName);
        
        switch(tabName) {
            case 'beranda':
                await this.loadBerandaData();
                break;
            case 'kategori':
                await this.loadCategoriesData();
                break;
            case 'statistik':
                await this.loadStatisticsData();
                break;
            default:
                // Untuk tab lain, tidak perlu load data khusus
                break;
        }
    }

    async loadInitialData() {
        await this.loadBerandaData();
    }

    async loadBerandaData() {
        this.showLoading();
        
        try {
            // Load statistics
            const stats = await ApiService.getRealTimeStatistics();
            if (stats.success) {
                this.renderStatsGrid(stats.data);
            } else {
                console.error('Failed to load stats:', stats.error);
                this.renderStatsGrid({}); // Render empty stats
            }

            // Load popular books
            const popularBooks = await this.getPopularBooks();
            this.renderPopularBooks(popularBooks);

        } catch (error) {
            console.error('Error loading beranda data:', error);
            this.showError('Gagal memuat data beranda');
        } finally {
            this.hideLoading();
        }
    }

    renderStatsGrid(stats) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📖</div>
                <div class="stat-number">${stats.total_books || 0}</div>
                <div class="stat-label">Total Buku</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number">${stats.total_members || 0}</div>
                <div class="stat-label">Total Anggota</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔄</div>
                <div class="stat-number">${stats.active_loans || 0}</div>
                <div class="stat-label">Sedang Dipinjam</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-number">4.8/5</div>
                <div class="stat-label">Rating</div>
            </div>
        `;
    }

    async getPopularBooks() {
        // Untuk sekarang, return mock data
        // Nanti bisa diganti dengan API call
        return [
            { 
                Judul_Buku: 'Matematika Kelas 6', 
                Pengarang: 'Budi Santoso', 
                loan_count: 35 
            },
            { 
                Judul_Buku: 'Ensiklopedia IPA', 
                Pengarang: 'Tim Penyusun', 
                loan_count: 28 
            },
            { 
                Judul_Buku: 'Cerita Rakyat Nusantara', 
                Pengarang: 'Sari Wijaya', 
                loan_count: 25 
            },
            { 
                Judul_Buku: 'Kamus Bahasa Inggris', 
                Pengarang: 'John Smith', 
                loan_count: 22 
            }
        ];
    }

    renderPopularBooks(books) {
        const container = document.getElementById('popularBooks');
        if (!container) return;

        if (!books || books.length === 0) {
            container.innerHTML = '<p class="no-data">Tidak ada data buku populer</p>';
            return;
        }

        container.innerHTML = books.slice(0, 4).map(book => `
            <div class="book-card">
                <div class="book-cover">📚</div>
                <div class="book-info">
                    <h3 class="book-title">${book.Judul_Buku || 'Judul tidak tersedia'}</h3>
                    <p class="book-author">${book.Pengarang || 'Pengarang tidak tersedia'}</p>
                    <p class="book-stats">⭐ ${book.loan_count || 0}x dipinjam</p>
                </div>
            </div>
        `).join('');
    }

    async performSearch() {
        this.showLoading();
        
        try {
            const query = document.getElementById('main-search')?.value || '';
            const category = document.getElementById('category-filter')?.value || '';
            const subject = document.getElementById('subject-filter')?.value || '';
            const yearFrom = document.getElementById('year-from')?.value || '';
            const yearTo = document.getElementById('year-to')?.value || '';
            const status = document.querySelector('input[name="status"]:checked')?.value || '';

            const filters = {
                query,
                category,
                subject,
                yearFrom,
                yearTo,
                status
            };

            console.log('Searching with filters:', filters);
            const results = await ApiService.searchBooks(filters);
            
            if (results.success) {
                this.searchResults = results.data || [];
            } else {
                this.searchResults = [];
                console.error('Search failed:', results.error);
            }
            
            this.currentPage = 1;
            this.renderSearchResults();

        } catch (error) {
            console.error('Search error:', error);
            this.showError('Gagal melakukan pencarian');
            this.searchResults = [];
            this.renderSearchResults();
        } finally {
            this.hideLoading();
        }
    }

    renderSearchResults() {
        const container = document.getElementById('searchResults');
        const countElement = document.getElementById('results-count');
        
        if (!container || !countElement) return;
        
        if (!this.searchResults || this.searchResults.length === 0) {
            container.innerHTML = '<div class="no-results">Tidak ada buku yang ditemukan</div>';
            countElement.textContent = 'Menampilkan 0 hasil';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const currentResults = this.searchResults.slice(startIndex, endIndex);

        countElement.textContent = `Menampilkan ${startIndex + 1}-${Math.min(endIndex, this.searchResults.length)} dari ${this.searchResults.length} hasil`;

        container.innerHTML = currentResults.map(book => `
            <div class="result-item">
                <div class="result-header">
                    <h3 class="book-title">${book.Judul_Buku || 'Judul tidak tersedia'}</h3>
                    <span class="book-status available">
                        ✅ Tersedia
                    </span>
                </div>
                <div class="result-details">
                    <p><strong>Pengarang:</strong> ${book.Pengarang || 'Tidak diketahui'}</p>
                    <p><strong>Tahun:</strong> ${book.Tahun_Terbit || 'Tidak diketahui'}</p>
                    <p><strong>Lokasi:</strong> Rak ${book.DDC_Code || 'Tidak diketahui'}</p>
                    <p><strong>Kategori:</strong> ${book.Category_Path || 'Tidak diketahui'}</p>
                </div>
            </div>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.searchResults.length / this.resultsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">⏮️ Prev</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="page-current">${i}</span>`;
            } else {
                paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
            }
        }

        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">Next ⏭️</button>`;
        }

        pagination.innerHTML = paginationHTML;

        // Add event listeners to page buttons
        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderSearchResults();
            });
        });
    }

    async loadCategoriesData() {
        this.showLoading();
        
        try {
            const categories = await ApiService.getDDCHierarchy();
            if (categories.success) {
                this.renderDDCTree(categories.data);
            } else {
                console.error('Failed to load categories:', categories.error);
                this.renderDDCTree([]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Gagal memuat data kategori');
        } finally {
            this.hideLoading();
        }
    }

    renderDDCTree(categories) {
        const treeContainer = document.getElementById('ddcTree');
        if (!treeContainer) return;
        
        if (!categories || categories.length === 0) {
            treeContainer.innerHTML = '<p class="no-data">Tidak ada data kategori</p>';
            return;
        }

        const renderTree = (items, level = 0) => {
            return items.map(item => `
                <div class="tree-item level-${level}">
                    <div class="tree-node" data-category-id="${item.Category_ID}">
                        <span class="tree-toggle">${item.children && item.children.length > 0 ? '➕' : '○'}</span>
                        <span class="tree-label">
                            ${item.DDC_Code || ''} - ${item.Category_Name || 'Unnamed'}
                            <span class="book-count">(${item.Book_Count || 0} buku)</span>
                        </span>
                    </div>
                    ${item.children && item.children.length > 0 ? `
                        <div class="tree-children">
                            ${renderTree(item.children, level + 1)}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        };

        treeContainer.innerHTML = renderTree(categories);
        
        // Add event listeners for tree interactions
        treeContainer.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = e.target.closest('.tree-node');
                const children = node.parentElement.querySelector('.tree-children');
                
                if (children) {
                    children.classList.toggle('expanded');
                    e.target.textContent = children.classList.contains('expanded') ? '➖' : '➕';
                }
            });
        });

        treeContainer.querySelectorAll('.tree-node').forEach(node => {
            node.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tree-toggle')) {
                    const categoryId = node.dataset.categoryId;
                    this.loadCategoryBooks(categoryId);
                }
            });
        });
    }

    async loadCategoryBooks(categoryId) {
        this.showLoading();
        
        try {
            const books = await ApiService.getBooksByCategory(categoryId);
            if (books.success) {
                this.renderCategoryBooks(books.data);
            } else {
                this.renderCategoryBooks([]);
            }
        } catch (error) {
            console.error('Error loading category books:', error);
            this.showError('Gagal memuat buku kategori');
        } finally {
            this.hideLoading();
        }
    }

    renderCategoryBooks(books) {
        const container = document.getElementById('categoryBooks');
        if (!container) return;
        
        if (!books || books.length === 0) {
            container.innerHTML = '<div class="no-data">Tidak ada buku dalam kategori ini</div>';
            return;
        }

        container.innerHTML = `
            <h3>Buku dalam Kategori (${books.length} buku)</h3>
            <div class="books-grid">
                ${books.map(book => `
                    <div class="book-card">
                        <div class="book-cover">📚</div>
                        <div class="book-info">
                            <h4 class="book-title">${book.Judul_Buku || 'Judul tidak tersedia'}</h4>
                            <p class="book-author">${book.Pengarang || 'Pengarang tidak tersedia'}</p>
                            <p class="book-year">${book.Tahun_Terbit || 'Tahun tidak diketahui'}</p>
                            <p class="book-status available">
                                ✅ Tersedia
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadStatisticsData() {
        this.showLoading();
        
        try {
            const stats = await ApiService.getRealTimeStatistics();
            if (stats.success) {
                this.renderStatistics(stats.data);
            } else {
                console.error('Failed to load statistics:', stats.error);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showError('Gagal memuat statistik');
        } finally {
            this.hideLoading();
        }
    }

    renderStatistics(stats) {
        if (!stats) return;

        // Update stat cards
        const statCards = document.getElementById('statCards');
        if (statCards) {
            statCards.innerHTML = `
                <div class="stat-card-large">
                    <div class="stat-icon">📖</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total_books || 0}</div>
                        <div class="stat-label">Total Buku</div>
                    </div>
                </div>
                <div class="stat-card-large">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total_members || 0}</div>
                        <div class="stat-label">Total Anggota</div>
                    </div>
                </div>
                <div class="stat-card-large">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.active_loans || 0}</div>
                        <div class="stat-label">Sedang Dipinjam</div>
                    </div>
                </div>
            `;
        }

        // Update top books list
        const topBooksList = document.getElementById('topBooksList');
        if (topBooksList) {
            topBooksList.innerHTML = `
                <div class="top-book-item">
                    <span class="rank">1</span>
                    <span class="title">Matematika Kelas 6</span>
                    <span class="count">35x dipinjam</span>
                </div>
                <div class="top-book-item">
                    <span class="rank">2</span>
                    <span class="title">Ensiklopedia IPA</span>
                    <span class="count">28x dipinjam</span>
                </div>
                <div class="top-book-item">
                    <span class="rank">3</span>
                    <span class="title">Cerita Rakyat</span>
                    <span class="count">25x dipinjam</span>
                </div>
            `;
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PublicApp...');
    window.publicApp = new PublicApp();
});

// Export untuk penggunaan global
window.PublicApp = PublicApp;