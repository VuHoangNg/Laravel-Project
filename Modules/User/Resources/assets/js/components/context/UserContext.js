import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";

const UserContext = createContext();

export function UserProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating users
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username:"",
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
                username:"",
                password: "",
                password_confirmation: "",
            }),
        createUser: async (formData) => {
            try {
                const response = await api.post("/api/user", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch({ type: "users/addUser", payload: response.data.user });
            } catch (error) {
                throw error;
            }
        },
    };

    // State for editing users
    const [editingUser, setEditingUser] = useState(null);

    const editingUserContext = {
        editingUser,
        setEditingUser,
        updateUser: async (id, formData) => {
            try {
                const response = await api.post(`/api/user/${id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch({ type: "users/updateUser", payload: response.data.user });
            } catch (error) {
                throw error;
            }
        },
    };

    // State for getting users
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getUserContext = {
        isModalOpen,
        openModal: (user = null) => {
            setEditingUser(user);
            setIsModalOpen(true);
            if (user) {
                setFormData({
                    name: user.name,
                    email: user.email,
                    username:user.username,
                    password: "",
                    password_confirmation: "",
                });
            }
        },
        closeModal: () => {
            setEditingUser(null);
            setIsModalOpen(false);
        },
        fetchUsers: async (page = 1, perPage = 10) => {
            try {
                const response = await api.get("/api/users", {
                    params: { page, per_page: perPage },
                });
                dispatch({ type: "users/setUsers", payload: response.data });
            } catch (error) {
                throw error;
            }
        },
    };

    // State for deleting users
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const deleteUserContext = {
        isDeleteModalOpen,
        userToDelete,
        openDeleteModal: (userId) => {
            setUserToDelete(userId);
            setIsDeleteModalOpen(true);
        },
        closeDeleteModal: () => {
            setUserToDelete(null);
            setIsDeleteModalOpen(false);
        },
        deleteUser: async (id) => {
            try {
                await api.delete(`/api/user/${id}`);
                dispatch({ type: "users/deleteUser", payload: id });
            } catch (error) {
                throw error;
            }
        },
    };

    return (
        <UserContext.Provider
            value={{
                createUserContext,
                editingUserContext,
                getUserContext,
                deleteUserContext,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    return useContext(UserContext);
}