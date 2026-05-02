import axios from "axios";

const isProduction = import.meta.env.PROD;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isProduction ? 'https://my-things-production.up.railway.app/api' : 'http://localhost:5000/api'),
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
