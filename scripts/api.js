class ApiService {
    static BASE_URL = 'https://script.google.com/macros/s/AKfycby3T2hqfBmZxVDEYmLF6kMJgwkKbwwRoRfAIzdlaGbOZYRvFUI05JYRUzIRPfSn6go/exec';

    static async makeRequest(action, params = {}) {
        try {
            const urlParams = new URLSearchParams();
            urlParams.append('action', action);
            
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    urlParams.append(key, params[key]);
                }
            });

            console.log(`Making API request: ${action}`, params);
            
            const response = await fetch(`${this.BASE_URL}?${urlParams}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // Untuk Google Apps Script perlu mode cors
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`API response for ${action}:`, result);
            return result;
            
        } catch (error) {
            console.error(`API Request failed for action ${action}:`, error);
            return { 
                success: false, 
                error: 'Koneksi ke server gagal',
                details: error.message 
            };
        }
    }

    // Public endpoints (no authentication required)
    static async getRealTimeStatistics() {
        return await this.makeRequest('getRealTimeStatistics');
    }

    static async getAllBooks() {
        return await this.makeRequest('getAllBooks');
    }

    static async searchBooks(filters = {}) {
        return await this.makeRequest('searchBooks', filters);
    }

    static async getDDCHierarchy(level = null, parentId = null) {
        const params = {};
        if (level !== null) params.level = level;
        if (parentId !== null) params.parentId = parentId;
        
        return await this.makeRequest('getDDCHierarchy', params);
    }

    static async searchDDC(query) {
        return await this.makeRequest('searchDDC', { query });
    }

    static async getBooksByCategory(categoryId) {
        return await this.makeRequest('getBooksByCategory', { categoryId });
    }

    static async getSystemInfo() {
        return await this.makeRequest('getSystemInfo');
    }

    static async testSystem() {
        return await this.makeRequest('testSystem');
    }

    // Authentication endpoints
    static async login(username, password) {
        return await this.makeRequest('login', { username, password });
    }

    static async validateSession(sessionId) {
        return await this.makeRequest('validateSession', { sessionId });
    }

    static async logout(sessionId) {
        return await this.makeRequest('logout', { sessionId });
    }

    // Protected endpoints (require session)
    static async protectedRequest(action, params = {}) {
        const session = AuthService.getSession();
        if (!session || !session.sessionId) {
            return { success: false, error: 'Session tidak valid' };
        }

        return await this.makeRequest(action, { ...params, sessionId: session.sessionId });
    }

    // Admin endpoints
    static async createBook(bookData) {
        return await this.protectedRequest('createBook', bookData);
    }

    static async getAllMembers(status = null) {
        const params = status ? { status } : {};
        return await this.protectedRequest('getAllMembers', params);
    }

    static async createStudent(studentData) {
        return await this.protectedRequest('createStudent', studentData);
    }

    static async borrowBook(transactionData) {
        return await this.protectedRequest('borrowBook', transactionData);
    }

    static async returnBook(transactionData) {
        return await this.protectedRequest('returnBook', transactionData);
    }

    static async generateReport(reportType, filters = {}) {
        return await this.protectedRequest('generateReport', { 
            reportType, 
            ...filters 
        });
    }

    // Utility method to handle API errors
    static handleApiError(error, defaultMessage = 'Terjadi kesalahan') {
        if (error && error.error) {
            return error.error;
        }
        return defaultMessage;
    }

    // Method to check if API is reachable
    static async healthCheck() {
        try {
            const response = await fetch(this.BASE_URL + '?action=getSystemInfo', {
                method: 'GET',
                mode: 'cors'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export untuk penggunaan global
window.ApiService = ApiService;