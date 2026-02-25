import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Must be set on the instance, not just axios.defaults
});

// Response interceptor for debugging and global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message || error.message;
    console.error(`[API Error] ${status} on ${url}: ${message}`);

    // If unauthorized, redirect to login (e.g., cookie expired)
    if (status === 401 && !url?.includes('/auth/')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
