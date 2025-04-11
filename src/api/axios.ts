import axios from 'axios';

const API = axios.create({
  baseURL: 'https://localhost:7104',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token in requests
API.interceptors.request.use(
  (config) => {
    console.log('Sending request:', config.method?.toUpperCase(), config.url, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle responses
API.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error.message || error);
    return Promise.reject(error);
  }
);

export default API; 