import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { setUsers, addUser } from "../reducer/action";

const UserContext = createContext();

export function UserProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating users
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username: "",
        password: "",
        password_confirmation: "",
    });

    const createUserContext = {
        formData,
        setFormData,
        resetForm: () =>
            setFormData({
                name: "",
                email: "",
                username: "",
                password: "",
                password_confirmation: "",
            }),
        createUser: async (formData) => {
            try {
                const response = await api.post("/api/user", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch(addUser(response.data.user));
            } catch (error) {
                throw error;
            }
        },
    };

    // State for getting users
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getUserContext = {
        isModalOpen,
        openModal: () => {
            setIsModalOpen(true);
        },
        closeModal: () => {
            setIsModalOpen(false);
        },
        fetchUsers: async (page = 1, perPage = 10, { signal } = {}) => {
            try {
                const response = await api.get("/api/users", {
                    params: { page, per_page: perPage },
                    signal,
                });
                dispatch(setUsers(response.data));
            } catch (error) {
                throw error;
            }
        },
        fetchUser: async (id) => {
            try {
                const response = await api.get(`/api/user/${id}`);
                return response.data.user;
            } catch (error) {
                throw error;
            }
        },
    };

    return (
        <UserContext.Provider
            value={{
                createUserContext,
                getUserContext,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    return useContext(UserContext);
}