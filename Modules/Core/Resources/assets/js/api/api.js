import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: "http://127.0.0.1:8000", // Your backend base URL
    headers: {
        Accept: "application/json",
        // Let Axios handle Content-Type automatically for multipart/form-data
    },
});

// Add Axios request interceptor
api.interceptors.request.use(
    (config) => {
        if (config.skipAuth) {
            return config;
        }
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure Content-Type is not set to application/json for file uploads
        if (config.headers["Content-Type"] === "multipart/form-data") {
            delete config.headers["Content-Type"]; // Axios will set this automatically
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
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Redirecting to login...");
            localStorage.removeItem("auth_token");
            window.location.href = "/auth/login";
        } else if (error.response?.status === 422) {
            console.error("Validation error:", error.response.data.errors);
            // Pass the error to the caller for frontend handling
            return Promise.reject(error);
        } else if (error.response?.status === 500) {
            console.error("Server error:", error.response.data.message);
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export default api;