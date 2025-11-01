// js/auth.js
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Email dan password harus diisi', 'error');
        return;
    }
    
    try {
        showMessage('Sedang login...', 'info');
        
        const result = await apiCall('login', { email, password });
        
        if (result.success) {
            currentUser = { user: email, role: result.role };
            showApp();
            switchPage('dashboard');
            showToast('Login berhasil!', 'success');
        } else {
            showMessage(result.message || 'Login gagal', 'error');
        }
    } catch (error) {
        showMessage('Koneksi gagal. Cek internet atau URL API.', 'error');
    }
});

function showMessage(msg, type) {
    const el = document.getElementById('loginMessage');
    el.textContent = msg;
    el.className = type;
    el.style.display = 'block';
}