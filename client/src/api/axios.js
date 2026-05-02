import axios from "axios";

// Check if the app is running on a live domain (not localhost)
const isLiveDomain = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const API = axios.create({
  // Force the Railway API URL if we are on a live domain, otherwise use localhost
  baseURL: isLiveDomain 
    ? 'https://my-things-production.up.railway.app/api' 
    : 'http://localhost:5000/api',
  withCredentials: true
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
