/**
 * API client module
 * Handles all API requests with authentication
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    /**
     * Get authorization headers
     */
    getAuthHeaders() {
        const token = window.authService.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Format error message from FastAPI validation errors
     */
    formatValidationErrors(detail) {
        // If detail is a string, return it directly
        if (typeof detail === 'string') {
            return detail;
        }
        
        // If detail is an array of validation errors (Pydantic format)
        if (Array.isArray(detail)) {
            return detail.map(err => {
                // Extract field name from location array
                const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'field';
                // Return the error message
                return `${field}: ${err.msg}`;
            }).join('; ');
        }
        
        // If detail is an object, try to extract message
        if (typeof detail === 'object' && detail !== null) {
            return detail.message || detail.msg || JSON.stringify(detail);
        }
        
        return 'Unknown error occurred';
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                window.authService.logout();
                throw new Error('Unauthorized');
            }

            // Handle other errors
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                // Format the error message
                const message = this.formatValidationErrors(error.detail || error.message || `HTTP ${response.status}`);
                throw new Error(message);
            }

            // Return JSON response
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * User API endpoints
     */
    users = {
        list: (params) => this.get('/users', params),
        get: (id) => this.get(`/users/${id}`),
        create: (data) => this.post('/users', data),
        update: (id, data) => this.put(`/users/${id}`, data),
        delete: (id) => this.delete(`/users/${id}`),
    };

    /**
     * Group API endpoints
     */
    groups = {
        list: (params) => this.get('/groups', params),
        get: (id) => this.get(`/groups/${id}`),
        create: (data) => this.post('/groups', data),
        update: (id, data) => this.put(`/groups/${id}`, data),
        delete: (id) => this.delete(`/groups/${id}`),
    };

    /**
     * Role API endpoints
     */
    roles = {
        list: (params) => this.get('/roles', params),
        get: (id) => this.get(`/roles/${id}`),
        create: (data) => this.post('/roles', data),
        update: (id, data) => this.put(`/roles/${id}`, data),
        delete: (id) => this.delete(`/roles/${id}`),
    };
}

// Create global API client instance
window.apiClient = new ApiClient();
