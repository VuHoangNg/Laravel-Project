import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: "http://127.0.0.1:8000", // Your backend base URL
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json", // Explicitly set for POST/PUT
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
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);

// Add Axios response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Redirecting to login...");
            localStorage.removeItem("auth_token"); // Clear invalid token
            window.location.href = "/auth/login";
        } else if (error.response?.status === 422) {
            console.error("Validation error:", error.response.data.errors);
            // Optionally handle validation errors in UI
        } else if (error.response?.status === 500) {
            console.error("Server error:", error.response.data.message);
        }
        return Promise.reject(error);
    }
);

export default api;