// 🎯 MAIN APPLICATION
class App {
    constructor() {
        this.currentSearchPage = 1;
        this.searchLimit = 20;
        this.searchResults = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHomeData();
    }

    setupEventListeners() {
        // Search input enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Status input enter key
        document.getElementById('statusNis').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkStudentStatus();
            }
        });

        // Quick status input enter key
        document.getElementById('quickNis').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkQuickStatus();
            }
        });

        // Login form enter key
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adminLogin();
            }
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.toggleView(view);
            });
        });

        // Quick filters
        document.querySelectorAll('.quick-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const filterType = e.target.getAttribute('data-filter');
                this.applyQuickFilter(filterType);
            });
        });

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('bookModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // 🏠 HOME DATA
    async loadHomeData() {
        this.showLoading();
        
        try {
            // Load statistics
            const stats = await api.getRealTimeStatistics();
            this.updateStatistics(stats.data);
            
            // Load featured books
            const books = await api.getFeaturedBooks();
            this.displayFeaturedBooks(books.data.data || []);
            
        } catch (error) {
            console.error('Error loading home data:', error);
            this.showError('Gagal memuat data beranda');
        } finally {
            this.hideLoading();
        }
    }

    updateStatistics(stats) {
        document.getElementById('totalBooks').textContent = stats.total_books || 0;
        document.getElementById('totalMembers').textContent = stats.total_members || 0;
        document.getElementById('activeStudents').textContent = stats.active_students || 0;
        document.getElementById('availableBooks').textContent = stats.available_exemplars || 0;
    }

    displayFeaturedBooks(books) {
        const container = document.getElementById('featuredBooks');
        
        if (!books || books.length === 0) {
            container.innerHTML = '<div class="loading">Tidak ada buku yang ditemukan</div>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="book-card" onclick="app.showBookDetails('${book.Barcode_Master}')">
                <div class="book-cover">
                    ${book.Cover_Type === 'URL' && book.Cover_URL ? 
                        `<img src="${book.Cover_URL}" alt="${book.Judul}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                        '📚'
                    }
                </div>
                <div class="book-info">
                    <h3>${book.Judul || 'Judul tidak tersedia'}</h3>
                    <div class="book-author">${book.Penulis || 'Penulis tidak tersedia'}</div>
                    <div class="book-meta">
                        <span class="book-type ${book.Jenis_Buku}">${this.getBookTypeLabel(book.Jenis_Buku)}</span>
                        <span class="book-status ${book.Available_Exemplars > 0 ? 'status-available' : 'status-borrowed'}">
                            ${book.Available_Exemplars > 0 ? 'Tersedia' : 'Dipinjam'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 🔍 OPAC FUNCTIONALITY
    async loadOPACData() {
        this.showLoading();
        
        try {
            // Load categories for filter
            const categories = await api.getCategories();
            this.populateCategoryFilter(categories.data.options.all_categories || []);
        } catch (error) {
            console.error('Error loading OPAC data:', error);
        } finally {
            this.hideLoading();
        }
    }

    populateCategoryFilter(categories) {
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="all">Semua Kategori</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            select.appendChild(option);
        });
    }

    async performSearch() {
        this.showLoading();
        this.currentSearchPage = 1;
        
        try {
            const searchParams = this.getSearchParams();
            const results = await api.searchBooks(searchParams);
            this.displaySearchResults(results.data);
        } catch (error) {
            console.error('Error performing search:', error);
            this.showError('Gagal melakukan pencarian');
        } finally {
            this.hideLoading();
        }
    }

    getSearchParams() {
        const searchInput = document.getElementById('searchInput');
        const bookTypeFilter = document.getElementById('bookTypeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        const params = {
            page: this.currentSearchPage,
            limit: this.searchLimit
        };

        if (searchInput.value) {
            params.search = searchInput.value;
        }

        if (bookTypeFilter.value !== 'all') {
            params.jenis_buku = bookTypeFilter.value;
        }

        if (statusFilter.value !== 'all') {
            params.status = statusFilter.value;
        }

        if (categoryFilter.value !== 'all') {
            params.category = categoryFilter.value;
        }

        if (sortFilter.value) {
            const [sortBy, sortOrder] = sortFilter.value.split(' ');
            params.sortBy = sortBy;
            params.sortOrder = sortOrder || 'asc';
        }

        return params;
    }

    displaySearchResults(data) {
        this.searchResults = data.data || [];
        const container = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const pagination = document.getElementById('pagination');

        // Update results count
        resultsCount.textContent = `Menampilkan ${this.searchResults.length} dari ${data.pagination?.total || 0} buku`;

        // Display books
        if (this.searchResults.length === 0) {
            container.innerHTML = '<div class="loading">Tidak ada buku yang sesuai dengan kriteria pencarian</div>';
            pagination.innerHTML = '';
            return;
        }

        const isGridView = document.querySelector('.view-btn[data-view="grid"]').classList.contains('active');
        
        if (isGridView) {
            container.className = 'books-container grid-view';
            container.innerHTML = this.searchResults.map(book => this.createBookCard(book)).join('');
        } else {
            container.className = 'books-container list-view';
            container.innerHTML = this.searchResults.map(book => this.createBookList(book)).join('');
        }

        // Display pagination
        this.displayPagination(data.pagination);
    }

    createBookCard(book) {
        return `
            <div class="book-card" onclick="app.showBookDetails('${book.Barcode_Master}')">
                <div class="book-cover">
                    ${book.Cover_Type === 'URL' && book.Cover_URL ? 
                        `<img src="${book.Cover_URL}" alt="${book.Judul}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                        '📚'
                    }
                </div>
                <div class="book-info">
                    <h3>${book.Judul || 'Judul tidak tersedia'}</h3>
                    <div class="book-author">${book.Penulis || 'Penulis tidak tersedia'}</div>
                    <div class="book-meta">
                        <span class="book-type ${book.Jenis_Buku}">${this.getBookTypeLabel(book.Jenis_Buku)}</span>
                        <span class="book-status ${book.Available_Exemplars > 0 ? 'status-available' : 'status-borrowed'}">
                            ${book.Available_Exemplars > 0 ? 'Tersedia' : 'Dipinjam'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    createBookList(book) {
        return `
            <div class="book-card" onclick="app.showBookDetails('${book.Barcode_Master}')">
                <div class="book-cover">
                    ${book.Cover_Type === 'URL' && book.Cover_URL ? 
                        `<img src="${book.Cover_URL}" alt="${book.Judul}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                        '📚'
                    }
                </div>
                <div class="book-info">
                    <h3>${book.Judul || 'Judul tidak tersedia'}</h3>
                    <div class="book-author">${book.Penulis || 'Penulis tidak tersedia'}</div>
                    <div class="book-details">
                        <p><strong>Penerbit:</strong> ${book.Penerbit || 'Tidak tersedia'}</p>
                        <p><strong>Tahun:</strong> ${book.Tahun_Terbit || 'Tidak tersedia'}</p>
                        <p><strong>Kategori:</strong> ${book.Category_Path || 'Tidak tersedia'}</p>
                    </div>
                    <div class="book-meta">
                        <span class="book-type ${book.Jenis_Buku}">${this.getBookTypeLabel(book.Jenis_Buku)}</span>
                        <span class="book-status ${book.Available_Exemplars > 0 ? 'status-available' : 'status-borrowed'}">
                            ${book.Available_Exemplars > 0 ? 'Tersedia' : 'Dipinjam'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    displayPagination(pagination) {
        const container = document.getElementById('pagination');
        
        if (!pagination || pagination.pages <= 1) {
            container.innerHTML = '';
            return;
        }

        const { page, pages, has_prev, has_next } = pagination;
        
        let html = `
            <button onclick="app.changePage(${page - 1})" ${!has_prev ? 'disabled' : ''}>
                ← Sebelumnya
            </button>
            <span class="pagination-info">Halaman ${page} dari ${pages}</span>
            <button onclick="app.changePage(${page + 1})" ${!has_next ? 'disabled' : ''}>
                Selanjutnya →
            </button>
        `;

        container.innerHTML = html;
    }

    async changePage(newPage) {
        this.showLoading();
        this.currentSearchPage = newPage;
        
        try {
            const searchParams = this.getSearchParams();
            searchParams.page = newPage;
            
            const results = await api.searchBooks(searchParams);
            this.displaySearchResults(results.data);
            
            // Scroll to top of results
            document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error changing page:', error);
            this.showError('Gagal memuat halaman');
        } finally {
            this.hideLoading();
        }
    }

    toggleView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Refresh display with current view
        if (this.searchResults.length > 0) {
            this.displaySearchResults({ 
                data: this.searchResults, 
                pagination: { 
                    page: this.currentSearchPage,
                    pages: Math.ceil(this.searchResults.length / this.searchLimit)
                }
            });
        }
    }

    applyQuickFilter(filterType) {
        document.querySelectorAll('.quick-filter').forEach(filter => {
            filter.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
        
        const bookTypeFilter = document.getElementById('bookTypeFilter');
        bookTypeFilter.value = filterType === 'all' ? 'all' : filterType;
        
        this.performSearch();
    }

    getBookTypeLabel(type) {
        const types = {
            'A': 'Buku Pelajaran',
            'B': 'Buku Umum', 
            'C': 'Referensi'
        };
        return types[type] || type;
    }

    // 📖 BOOK DETAILS
    async showBookDetails(barcode) {
        this.showLoading();
        
        try {
            const bookData = await api.getBookByBarcode(barcode);
            this.displayBookModal(bookData.data);
        } catch (error) {
            console.error('Error loading book details:', error);
            this.showError('Gagal memuat detail buku');
        } finally {
            this.hideLoading();
        }
    }

    displayBookModal(book) {
        const modal = document.getElementById('bookModal');
        const content = document.getElementById('bookModalContent');
        
        content.innerHTML = `
            <div class="book-detail-header">
                <h2>${book.Judul || 'Judul tidak tersedia'}</h2>
                <div class="book-detail-meta">
                    <span class="book-type large ${book.Jenis_Buku}">${this.getBookTypeLabel(book.Jenis_Buku)}</span>
                    <span class="book-status large ${book.Available_Exemplars > 0 ? 'status-available' : 'status-borrowed'}">
                        ${book.Available_Exemplars > 0 ? 'Tersedia' : 'Dipinjam'}
                    </span>
                </div>
            </div>
            
            <div class="book-detail-content">
                <div class="book-detail-cover">
                    ${book.Cover_Type === 'URL' && book.Cover_URL ? 
                        `<img src="${book.Cover_URL}" alt="${book.Judul}" style="width: 200px; height: 300px; object-fit: cover; border-radius: 8px;">` : 
                        '<div style="width: 200px; height: 300px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 4rem;">📚</div>'
                    }
                </div>
                
                <div class="book-detail-info">
                    <div class="detail-row">
                        <strong>Penulis:</strong> ${book.Penulis || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>Penerbit:</strong> ${book.Penerbit || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>Tahun Terbit:</strong> ${book.Tahun_Terbit || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>ISBN:</strong> ${book.ISBN || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>Kategori:</strong> ${book.Category_Path || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>DDC Code:</strong> ${book.DDC_Code || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>Lokasi:</strong> ${book.Lokasi_Default || 'Tidak tersedia'}
                    </div>
                    <div class="detail-row">
                        <strong>Total Exemplar:</strong> ${book.Total_Exemplars || 0}
                    </div>
                    <div class="detail-row">
                        <strong>Tersedia:</strong> ${book.Available_Exemplars || 0}
                    </div>
                    <div class="detail-row">
                        <strong>Barcode Master:</strong> ${book.Barcode_Master || 'Tidak tersedia'}
                    </div>
                </div>
            </div>
            
            ${book.Tags ? `
                <div class="book-detail-tags">
                    <strong>Tags:</strong> ${book.Tags}
                </div>
            ` : ''}
            
            <div class="book-detail-actions">
                <button class="btn-primary" onclick="app.closeModal()">Tutup</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('bookModal').style.display = 'none';
    }

    // 👤 STATUS FUNCTIONALITY
    async checkStudentStatus() {
        const nis = document.getElementById('statusNis').value.trim();
        
        if (!nis) {
            this.showError('Harap masukkan NIS siswa', 'statusResults');
            return;
        }

        this.showLoading();
        
        try {
            const status = await api.getStudentStatus(nis);
            this.displayStudentStatus(status.data);
        } catch (error) {
            console.error('Error checking student status:', error);
            this.showError('Gagal memuat status siswa. Pastikan NIS benar.', 'statusResults');
        } finally {
            this.hideLoading();
        }
    }

    async checkQuickStatus() {
        const nis = document.getElementById('quickNis').value.trim();
        
        if (!nis) {
            this.showError('Harap masukkan NIS siswa', 'quickStatusResult');
            return;
        }

        this.showLoading();
        
        try {
            const status = await api.getStudentStatus(nis);
            this.displayQuickStatus(status.data);
        } catch (error) {
            console.error('Error checking quick status:', error);
            this.showError('Gagal memuat status siswa. Pastikan NIS benar.', 'quickStatusResult');
        } finally {
            this.hideLoading();
        }
    }

    displayStudentStatus(data) {
        const container = document.getElementById('statusResults');
        const { student, active_loans, quota, summary } = data;
        
        container.innerHTML = `
            <div class="status-detail">
                <div class="student-info-card">
                    <h3>Informasi Siswa</h3>
                    <div class="student-details">
                        <div class="detail-item">
                            <strong>NIS:</strong> ${student.nis}
                        </div>
                        <div class="detail-item">
                            <strong>Nama:</strong> ${student.nama}
                        </div>
                        <div class="detail-item">
                            <strong>Kelas:</strong> ${student.kelas}
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong> ${student.status}
                        </div>
                        <div class="detail-item">
                            <strong>Jenis Anggota:</strong> ${student.jenis_anggota}
                        </div>
                    </div>
                </div>

                <div class="quota-info-card">
                    <h3>Kuota Peminjaman</h3>
                    <div class="quota-details">
                        <div class="quota-item">
                            <strong>Digunakan:</strong> ${quota.current} buku
                        </div>
                        <div class="quota-item">
                            <strong>Maksimal:</strong> ${quota.max === 999 ? 'UNLIMITED' : quota.max} buku
                        </div>
                        <div class="quota-item">
                            <strong>Sisa:</strong> ${quota.remaining === 999 ? 'UNLIMITED' : quota.remaining} buku
                        </div>
                        <div class="quota-item">
                            <strong>Utilisasi:</strong> ${quota.utilization}
                        </div>
                    </div>
                </div>

                ${active_loans.length > 0 ? `
                    <div class="active-loans-card">
                        <h3>📚 Buku Sedang Dipinjam (${active_loans.length})</h3>
                        <div class="loans-list">
                            ${active_loans.map(loan => `
                                <div class="loan-item ${loan.is_overdue ? 'overdue' : ''}">
                                    <div class="loan-book">
                                        <strong>${loan.judul}</strong> - ${loan.penulis}
                                    </div>
                                    <div class="loan-details">
                                        <span>Jatuh Tempo: ${loan.due_date}</span>
                                        <span class="loan-status ${loan.is_overdue ? 'overdue' : ''}">
                                            ${loan.is_overdue ? `⏰ TERLAMBAT ${Math.abs(loan.days_remaining)} hari` : `⏳ ${loan.days_remaining} hari lagi`}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="no-loans-card">
                        <h3>✅ Tidak Ada Peminjaman Aktif</h3>
                        <p>Siswa ini tidak memiliki buku yang sedang dipinjam.</p>
                    </div>
                `}

                <div class="summary-card">
                    <h3>📊 Ringkasan Statistik</h3>
                    <div class="summary-details">
                        <div class="summary-item">
                            <strong>Total Peminjaman:</strong> ${summary.total_loans}
                        </div>
                        <div class="summary-item">
                            <strong>Total Denda Dibayar:</strong> Rp ${summary.total_fines_paid.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayQuickStatus(data) {
        const container = document.getElementById('quickStatusResult');
        const { student, active_loans, quota } = data;
        
        let statusHTML = `
            <div class="quick-status-result">
                <h4>Status: ${student.nama} (Kelas ${student.kelas})</h4>
                <p><strong>Peminjaman Aktif:</strong> ${active_loans.length} buku</p>
                <p><strong>Kuota:</strong> ${quota.current}/${quota.max === 999 ? '∞' : quota.max}</p>
        `;
        
        if (active_loans.length > 0) {
            statusHTML += `
                <div class="quick-loans">
                    <strong>Buku yang dipinjam:</strong>
                    <ul>
                        ${active_loans.slice(0, 3).map(loan => `
                            <li>${loan.judul} - Jatuh tempo: ${loan.due_date}</li>
                        `).join('')}
                        ${active_loans.length > 3 ? `<li>... dan ${active_loans.length - 3} buku lainnya</li>` : ''}
                    </ul>
                </div>
            `;
        }
        
        statusHTML += `</div>`;
        container.innerHTML = statusHTML;
    }

    // 🔐 LOGIN FUNCTIONALITY
    async adminLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const messageDiv = document.getElementById('loginMessage');

        if (!username || !password) {
            this.showError('Harap isi username dan password', 'loginMessage');
            return;
        }

        this.showLoading();
        
        try {
            const result = await api.adminLogin(username, password);
            
            if (result.success) {
                // Store session and redirect to admin page
                localStorage.setItem('adminSession', result.data.sessionId);
                localStorage.setItem('adminUsername', result.data.user);
                
                messageDiv.innerHTML = '<div class="success">Login berhasil! Mengarahkan...</div>';
                
                // Redirect to admin page after short delay
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login gagal. Periksa username dan password.', 'loginMessage');
        } finally {
            this.hideLoading();
        }
    }

    // 🛠️ UTILITY FUNCTIONS
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showError(message, elementId = null) {
        if (elementId) {
            const element = document.getElementById(elementId);
            element.innerHTML = `<div class="error-message">${message}</div>`;
        } else {
            // Could implement a toast notification here
            console.error('Error:', message);
        }
    }
}

// Initialize app
const app = new App();