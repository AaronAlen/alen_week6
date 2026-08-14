import axios from 'axios';

/**
 * FRONTEND API SERVICE (Axios Client)
 * 
 * Includes:
 * 1. Request Interceptor: Automatically attaches Access Token as Bearer token header.
 * 2. Response Interceptor: Automatically catches 401 Un-authorized errors and calls
 *    /api/auth/refresh to fetch a new access token without logging out the user!
 */

const API = axios.create({
  baseURL: '/api'
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

// Response Interceptor: Refresh Token Strategy
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Attempt to get a new access token using the refresh token
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          
          // Save new access token
          localStorage.setItem('accessToken', data.accessToken);
          
          // Update header and retry original failed request
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return API(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
