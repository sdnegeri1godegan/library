// js/students.js
async function loadStudentsPage() {
    elements.pageContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h1 class="card-title"><i class="fas fa-users"></i> Data Siswa</h1>
                <button class="btn-primary btn-sm" onclick="showAddStudentModal()">
                    <i class="fas fa-plus"></i> Tambah Siswa
                </button>
            </div>
            <div id="studentsList">Memuat...</div>
        </div>
    `;
    
    await loadStudentsList();
}

async function loadStudentsList() {
    try {
        const students = await apiCall('getAllStudents');
        const container = document.getElementById('studentsList');
        
        if (students.length === 0) {
            container.innerHTML = '<p>Tidak ada data siswa.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>NIS</th>
                            <th>Nama</th>
                            <th>Kelas</th>
                            <th>Status</th>
                            <th>Dipinjam</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr>
                                <td>${s.NIS}</td>
                                <td>${s.Nama}</td>
                                <td>${s.Kelas}</td>
                                <td><span class="status status-${s.Status.toLowerCase()}">${s.Status}</span></td>
                                <td>${s.Buku_Dipinjam || 0}</td>
                                <td>
                                    <button class="btn-sm btn-sm-primary" onclick="viewStudent('${s.NIS}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        document.getElementById('studentsList').innerHTML = '<p style="color:red;">Gagal memuat data.</p>';
    }
}

function showAddStudentModal() {
    alert('Fitur tambah siswa akan segera hadir!');
}

function viewStudent(nis) {
    alert(`Lihat detail siswa NIS: ${nis}`);
}

window.loadStudentsPage = loadStudentsPage;