import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: "http://127.0.0.1:8000", // Your backend base URL
    headers: {
        Accept: "application/json",
    },
});

// Add Axios request interceptor
api.interceptors.request.use(
    (config) => {
        // Skip adding the Authorization header if "skipAuth" is true
        if (config.skipAuth) {
            return config;
        }

        // Retrieve the token from localStorage
        const token = localStorage.getItem("auth_token");
        if (token) {
            // Add Authorization header with Bearer token
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn("Authorization token not found!"); // Debugging message
        }
        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);

// Add Axios response interceptor (optional, for handling errors globally)
api.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Redirecting to login...");
            // Example: Redirect user to login page if token is invalid or expired
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);

export default api;