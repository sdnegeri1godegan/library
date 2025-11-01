class AuthService {
    // Gunakan BASE_URL dari ApiService
    static get BASE_URL() {
        return ApiService.BASE_URL;
    }

    static async login(username, password) {
        try {
            console.log('Attempting login for user:', username);
            
            const result = await ApiService.login(username, password);
            
            if (result.success) {
                // Save session data
                const sessionData = {
                    sessionId: result.sessionId,
                    username: username,
                    loginTime: new Date().getTime(),
                    expiresAt: new Date().getTime() + (30 * 60 * 1000) // 30 minutes
                };
                
                localStorage.setItem('library_session', JSON.stringify(sessionData));
                console.log('Login successful, session saved');
                return { success: true, data: result };
            } else {
                console.log('Login failed:', result.error);
                return { success: false, error: result.error || 'Login gagal' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Koneksi ke server gagal' };
        }
    }

    static async validateSession() {
        const session = this.getSession();
        
        if (!session) {
            console.log('No session found');
            return false;
        }

        // Check if session is expired
        const now = new Date().getTime();
        if (now > session.expiresAt) {
            console.log('Session expired');
            this.logout();
            return false;
        }

        try {
            console.log('Validating session:', session.sessionId);
            const result = await ApiService.validateSession(session.sessionId);
            console.log('Session validation result:', result);
            return result.valid;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    static getSession() {
        try {
            const session = localStorage.getItem('library_session');
            if (session) {
                const parsed = JSON.parse(session);
                console.log('Retrieved session:', parsed.username);
                return parsed;
            }
            console.log('No session in localStorage');
            return null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    static isLoggedIn() {
        const session = this.getSession();
        if (!session) {
            console.log('Not logged in: no session');
            return false;
        }

        // Check session expiration
        const now = new Date().getTime();
        const isExpired = now > session.expiresAt;
        
        if (isExpired) {
            console.log('Session expired, logging out');
            this.logout();
            return false;
        }

        console.log('User is logged in:', session.username);
        return true;
    }

    static logout() {
        const session = this.getSession();
        if (session && session.sessionId) {
            console.log('Logging out session:', session.sessionId);
            // Call logout API
            ApiService.logout(session.sessionId)
                .then(result => console.log('Logout API result:', result))
                .catch(error => console.error('Logout API error:', error));
        } else {
            console.log('No session to logout');
        }
        
        localStorage.removeItem('library_session');
        console.log('Session removed from localStorage');
    }

    static getAuthHeaders() {
        const session = this.getSession();
        if (session && session.sessionId) {
            return { 'Session-ID': session.sessionId };
        }
        return {};
    }

    // Utility function to check and redirect if not logged in
    static requireAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            console.log('Authentication required, redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Utility function to redirect if already logged in
    static redirectIfLoggedIn(redirectUrl = 'admin.html') {
        if (this.isLoggedIn()) {
            console.log('Already logged in, redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
            return true;
        }
        return false;
    }

    // Get current user info
    static getCurrentUser() {
        const session = this.getSession();
        return session ? { username: session.username } : null;
    }

    // Refresh session expiration
    static refreshSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = new Date().getTime() + (30 * 60 * 1000); // Extend 30 minutes
            localStorage.setItem('library_session', JSON.stringify(session));
            console.log('Session refreshed until:', new Date(session.expiresAt));
        }
    }

    // Clear session without API call (for forced logout)
    static clearSession() {
        localStorage.removeItem('library_session');
        console.log('Session cleared forcefully');
    }
}

// Auto-refresh session every 10 minutes
setInterval(() => {
    if (AuthService.isLoggedIn()) {
        AuthService.refreshSession();
    }
}, 10 * 60 * 1000);

// Export untuk penggunaan global
window.AuthService = AuthService;