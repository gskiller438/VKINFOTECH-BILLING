/**
 * Central configuration for the application
 */
export const CONFIG = {
    // Use relative path '/api' in production to allow Netlify proxy/functions
    // or use the window origin. For now, we detect localhost for dev.
    API_BASE_URL: (typeof window !== 'undefined' && window.location.hostname === 'localhost')
        ? 'http://localhost:5000/api'
        : '/api'
};
