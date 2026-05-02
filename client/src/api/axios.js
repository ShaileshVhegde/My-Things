import axios from "axios";

console.log("API URL:", import.meta.env.VITE_API_URL);

// Use the environment variable, but ensure we don't accidentally fall back to localhost in production
const isLiveDomain = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const fallbackUrl = isLiveDomain ? 'https://my-things-jo3p.onrender.com/api' : 'http://localhost:5000/api';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackUrl,
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
