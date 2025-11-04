// 📡 API SERVICE
class ApiService {
    constructor() {
        // 🔧 UPDATE THIS WITH YOUR GAS SCRIPT URL
        this.baseUrl = 'https://script.google.com/macros/s/AKfycbxbVB6aAfLqr56iUNlfHoJRuJPY_3kUqToqmZuMA3AcwsyQVUk_L0k7I_IZ52g6lWA/exec';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async request(endpoint, params = {}) {
        try {
            const url = new URL(this.baseUrl);
            
            // Add all parameters to URL
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            // Add endpoint as action parameter
            if (endpoint) {
                url.searchParams.append('action', endpoint);
            }

            console.log('📡 API Request:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error?.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // Cache helper
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 📊 Homepage APIs
    async getRealTimeStatistics() {
        const cacheKey = 'stats';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.request('getRealTimeStatistics');
            this.setCached(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error getting statistics:', error);
            // Return fallback data
            return {
                success: true,
                data: {
                    total_books: 0,
                    total_members: 0,
                    active_students: 0,
                    available_exemplars: 0
                }
            };
        }
    }

    async getFeaturedBooks() {
        try {
            const data = await this.request('getBooksWithFilters', {
                limit: 8,
                sortBy: 'Created_At',
                sortOrder: 'desc'
            });
            return data;
        } catch (error) {
            console.error('Error getting featured books:', error);
            return { success: true, data: { data: [] } };
        }
    }

    // 🔍 OPAC APIs
    async searchBooks(params = {}) {
        try {
            const data = await this.request('getBooksWithFilters', params);
            return data;
        } catch (error) {
            console.error('Error searching books:', error);
            return { success: true, data: { data: [], pagination: { total: 0 } } };
        }
    }

    async getBookByBarcode(barcode) {
        try {
            const data = await this.request('getBookByBarcode', { barcode });
            return data;
        } catch (error) {
            console.error('Error getting book details:', error);
            throw error;
        }
    }

    async getCategories() {
        const cacheKey = 'categories';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.request('getCategoryFilterOptions');
            this.setCached(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error getting categories:', error);
            return { success: true, data: { options: { all_categories: [] } } };
        }
    }

    // 👤 Status APIs
    async getStudentStatus(nis) {
        try {
            const data = await this.request('getStudentLoanContext', { nis });
            return data;
        } catch (error) {
            console.error('Error getting student status:', error);
            throw error;
        }
    }

    // 🔐 Auth APIs
    async adminLogin(username, password) {
        try {
            const data = await this.request('login', { username, password });
            return data;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }

    // 🧹 Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Initialize API service
const api = new ApiService();