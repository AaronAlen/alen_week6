import axios from 'axios';

/**
 * FRONTEND API SERVICE (Axios Client)
 * 
 * Includes:
 * 1. Request Interceptor: Automatically attaches Access Token as Bearer token header.
 * 2. Response Interceptor: Automatically catches 401 Un-authorized errors and calls
 *    /api/auth/refresh to fetch a new access token without logging out the user!
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanUrl = rawApiUrl.replace(/\/$/, '');
const baseURL = cleanUrl ? (cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`) : '/api';

const API = axios.create({
  baseURL,
  withCredentials: true
});

// Request Interceptor: Attach Bearer Access Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Refresh Token Strategy (via HttpOnly Cookie)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, request hasn't retried yet, and request isn't refresh endpoint itself
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to get a new access token using HttpOnly Cookie sent automatically by browser
        const { data } = await API.post('/auth/refresh');
        
        // Save new access token
        localStorage.setItem('accessToken', data.accessToken);
        
        // Update header and retry original failed request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear user state and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
