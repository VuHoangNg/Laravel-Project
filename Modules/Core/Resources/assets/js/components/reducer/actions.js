import { message } from "antd";

export const setToken = (token) => (dispatch) => {
    localStorage.setItem("auth_token", token);
    dispatch({ type: "auth/setToken", payload: token });
};

export const clearToken = () => (dispatch) => {
    localStorage.removeItem("auth_token");
    dispatch({ type: "auth/clearToken" });
    message.error("Session expired. Please log in again.");
};