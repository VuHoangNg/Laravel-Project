import api from "../../../../../Core/Resources/assets/js/api/api";
import { message } from "antd";

export const login = (userData) => async (dispatch) => {
    try {
        const response = await api.post("/api/login", userData);
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
        const response = await api.post("/api/register", userData);
        dispatch({ type: "register", payload: response.data });
        message.success(`Account created successfully, ${response.data.name}!`);
    } catch (error) {
        message.error(error.response?.data?.message || "Sign up failed");
        console.error(error);
    }
};

export const logout = () => async (dispatch) => {
    try {
        await api.post("/api/logout");
        dispatch({ type: "logout" });
    } catch (error) {
        message.error(error.response?.data?.message || "Logout failed");
        console.error(error);
    }
};
