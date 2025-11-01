// js/books.js
async function loadBooksPage() {
    elements.pageContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title"><i class="fas fa-book"></i> Koleksi Buku</h1>
                <button class="btn-primary btn-sm" onclick="alert('Tambah buku segera hadir!')">
                    <i class="fas fa-plus"></i> Tambah Buku
                </button>
            </div>
            <div class="input-group" style="margin-bottom:1rem;">
                <input type="text" id="searchBook" placeholder="Cari judul, penulis, atau barcode..." 
                       style="flex:1; padding:0.75rem; border-radius:8px; border:1px solid #ddd;">
                <button class="btn-primary" onclick="searchBooks()">Cari</button>
            </div>
            <div id="booksList">Memuat...</div>
        </div>
    `;
    
    await loadBooksList();
}

async function loadBooksList() {
    try {
        const books = await apiCall('getAllBooks');
        const container = document.getElementById('booksList');
        
        if (!books || books.length === 0) {
            container.innerHTML = '<p>Tidak ada buku.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Barcode</th>
                            <th>Judul</th>
                            <th>Penulis</th>
                            <th>Tersedia</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${books.map(b => {
                            const avail = b.available || 0;
                            const total = b.totalExemplars || b.Jumlah_Exemplar || 0;
                            return `
                                <tr>
                                    <td><code>${b.Barcode_Master}</code></td>
                                    <td>${b.Judul}</td>
                                    <td>${b.Penulis}</td>
                                    <td><span class="status status-${avail > 0 ? 'available' : 'dipinjam'}">
                                        ${avail}
                                    </span></td>
                                    <td>${total}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('booksList').innerHTML = '<p style="color:red;">Gagal memuat buku.</p>';
    }
}

async function searchBooks() {
    const query = document.getElementById('searchBook').value;
    if (!query) return loadBooksList();
    
    try {
        const results = await apiCall('searchBooks', { query });
        // Sama seperti loadBooksList, tapi pakai results
        loadBooksList(); // sementara
    } catch (error) {
        showToast('Pencarian gagal', 'error');
    }
}

window.loadBooksPage = loadBooksPage;