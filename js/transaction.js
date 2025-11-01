// js/transactions.js
async function loadTransactionsPage() {
    elements.pageContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title"><i class="fas fa-exchange-alt"></i> Peminjaman Aktif</h1>
            </div>
            <div id="loansList">Memuat...</div>
        </div>
    `;
    
    await loadActiveLoans();
}

async function loadActiveLoans() {
    try {
        const loans = await apiCall('getActiveLoans');
        const container = document.getElementById('loansList');
        
        if (loans.length === 0) {
            container.innerHTML = '<p>Tidak ada peminjaman aktif.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>NIS</th>
                            <th>Siswa</th>
                            <th>Buku</th>
                            <th>Tanggal Pinjam</th>
                            <th>Batas</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${loans.map(async loan => {
                            const student = await apiCall('getStudent', { nis: loan.NIS });
                            const exemplar = await apiCall('getBookExemplars', { barcode: loan.ID_Exemplar.split('-')[0] });
                            return `<tr><td colspan="6">Memuat...</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        // Sementara tampilkan data mentah
        container.innerHTML = `<pre>${JSON.stringify(loans, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('loansList').innerHTML = '<p style="color:red;">Gagal memuat transaksi.</p>';
    }
}

window.loadTransactionsPage = loadTransactionsPage;