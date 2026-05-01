import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create a centralized axios instance with sensible defaults
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15s timeout
});

// Request interceptor: attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if network error (e.g. ERR_CONNECTION_REFUSED)
    if (!error.response) {
      console.error('[API Network Error]:', error.message);
      // Could potentially implement retry logic here for transient failures
    } else if (error.response.status === 401) {
      // Handle unauthorized explicitly if needed (e.g. clear token and reload)
      console.error('[API Auth Error]: 401 Unauthorized');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
