/**
 * Authentication module
 * Handles login, logout, token management
 */

const AUTH_CONFIG = {
    TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    TOKEN_EXPIRY_KEY: 'token_expires_at',
    USER_INFO_KEY: 'user_info',
};

class AuthService {
    constructor() {
        this.checkTokenExpiry();
    }

    /**
     * Login with username and password
     */
    async login(username, password) {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/pwd-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();
            this.setTokens(data);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Store tokens in localStorage
     */
    setTokens(data) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
        localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY, data.expires_at);
    }

    /**
     * Get access token
     */
    getToken() {
        return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }

    /**
     * Get refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        const expiryTime = localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
        if (expiryTime) {
            const now = new Date();
            const expiry = new Date(expiryTime);
            if (now >= expiry) {
                this.logout();
                return false;
            }
        }

        return true;
    }

    /**
     * Check token expiry periodically
     */
    checkTokenExpiry() {
        setInterval(() => {
            if (!this.isAuthenticated() && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }, 60000); // Check every minute
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_INFO_KEY);
        window.location.href = '/login';
    }

    /**
     * Store user info
     */
    setUserInfo(userInfo) {
        localStorage.setItem(AUTH_CONFIG.USER_INFO_KEY, JSON.stringify(userInfo));
    }

    /**
     * Get user info
     */
    getUserInfo() {
        const userInfo = localStorage.getItem(AUTH_CONFIG.USER_INFO_KEY);
        return userInfo ? JSON.parse(userInfo) : null;
    }
}

// Create global auth instance
window.authService = new AuthService();
