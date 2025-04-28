import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { addMedia, setMedia } from "../reducer/action";

const MediaContext = createContext();

export function MediaProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating media
    const [formData, setFormData] = useState({
        title: "",
        file: null,
    });

    const createMediaContext = {
        formData,
        setFormData,
        resetForm: () => setFormData({ title: "", file: null }),
        createMedia: async (data) => {
            try {
                const formData = new FormData();
                formData.append("title", data.title);
                if (data.file) {
                    formData.append("file", data.file);
                } else {
                    throw new Error("No file selected for upload");
                }
                const response = await api.post("/api/media", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch(addMedia(response.data));
            } catch (error) {
                throw error;
            }
        },
    };

    // State for getting media
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getMediaContext = {
        isModalOpen,
        openModal: () => {
            setIsModalOpen(true);
        },
        closeModal: () => {
            setIsModalOpen(false);
        },
        fetchMedia: async (page = 1, perPage = 10, { signal } = {}) => {
            try {
                const response = await api.get("/api/media", {
                    params: { page, perPage },
                    signal,
                });
                dispatch(setMedia(response.data));
            } catch (error) {
                console.error("Error fetching media:", error);
                throw error;
            }
        },
        fetchMediaById: async (id) => {
            try {
                const response = await api.get(`/api/media/${id}`);
                return response.data;
            } catch (error) {
                throw error;
            }
        },
    };

    return (
        <MediaContext.Provider
            value={{
                createMediaContext,
                getMediaContext,
            }}
        >
            {children}
        </MediaContext.Provider>
    );
}

export function useMediaContext() {
    return useContext(MediaContext);
}
