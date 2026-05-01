import axios from 'axios';

const API = 'http://localhost:5000/api';

export const getToken = () => localStorage.getItem('token');

export const authAxios = () => axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${getToken()}` }
});
