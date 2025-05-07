import api from "../../../../../../Core/Resources/assets/js/api/api";
import { message } from "antd";

export const setToken = (token, dispatch) => {
    localStorage.setItem("auth_token", token);
    dispatch({ type: "auth/setToken", payload: token });
};

export const clearToken = (dispatch) => {
    localStorage.removeItem("auth_token");
    dispatch({ type: "auth/clearToken" });
    message.error("Session expired. Please log in again.");
};

export const login = (userData) => async (dispatch) => {
    try {
        const response = await api.post("/api/auth/login", userData);
        dispatch({ type: "login", payload: response.data });
        localStorage.setItem("auth_token", response.data.token);
        message.success(`Welcome, ${response.data.username}!`);
    } catch (error) {
        message.error(error.response?.data?.message || "Login failed");
        console.error(error);
    }
};

export const register = (userData) => async (dispatch) => {
    try {
        const response = await api.post("/api/auth/register", userData);
        dispatch({ type: "register", payload: response.data });
        message.success(`Account created successfully, ${response.data.name}!`);
        return response; // Trả về phản hồi từ API
    } catch (error) {
        message.error(error.response?.data?.message || "Sign up failed");
        console.error(error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

export const logout = () => async (dispatch) => {
    await api.post("/api/auth/logout");
    dispatch({ type: "logout" });
    dispatch(clearToken());
    window.location.href = "/auth/login";
};
