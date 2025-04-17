import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";

// Create a single MediaContext
const MediaContext = createContext();

// MediaProvider to manage all context logic and API calls
export function MediaProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating media
    const [formData, setFormData] = useState({ title: "", file: null, type: "" });

    const createMediaContext = {
        formData,
        setFormData,
        resetForm: () => setFormData({ title: "", file: null, type: "" }),
        createMedia: async (data) => {
            try {
                const formData = new FormData();
                formData.append("title", data.title);
                if (data.file) {
                    formData.append("file", data.file);
                } else {
                    throw new Error("No file selected for upload");
                }
                formData.append("type", data.type);
                const response = await api.post("/api/media", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch({ type: "media/addMedia", payload: response.data });
            } catch (error) {
                console.error("Failed to create media:", error);
                throw error;
            }
        },
    };

    // State for editing media
    const [editingMedia, setEditingMedia] = useState(null);

    const editingMediaContext = {
        editingMedia,
        setEditingMedia,
        updateMedia: async (id, data) => {
            try {
                const formData = new FormData();
                formData.append("title", data.title);
                if (data.file) {
                    formData.append("file", data.file);
                }
                formData.append("type", data.type);
                const response = await api.put(`/api/media/${id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                dispatch({ type: "media/updateMedia", payload: response.data });
            } catch (error) {
                console.error("Failed to update media:", error);
                throw error;
            }
        },
    };

    // State for getting media (modal control)
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getMediaContext = {
        isModalOpen,
        openModal: (media = null) => {
            setEditingMedia(media);
            setIsModalOpen(true);
        },
        closeModal: () => {
            setEditingMedia(null);
            setIsModalOpen(false);
        },
        fetchMedia: async () => {
            try {
                const response = await api.get("/api/media");
                dispatch({ type: "media/setMedia", payload: response.data });
            } catch (error) {
                console.error("Failed to fetch media:", error);
                throw error;
            }
        },
    };

    // State for deleting media
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);

    const deleteMediaContext = {
        isDeleteModalOpen,
        mediaToDelete,
        openDeleteModal: (mediaId) => {
            setMediaToDelete(mediaId);
            setIsDeleteModalOpen(true);
        },
        closeDeleteModal: () => {
            setMediaToDelete(null);
            setIsDeleteModalOpen(false);
        },
        deleteMedia: async (id) => {
            try {
                await api.delete(`/api/media/${id}`);
                dispatch({ type: "media/deleteMedia", payload: id });
            } catch (error) {
                console.error("Failed to delete media:", error);
                throw error;
            }
        },
    };

    return (
        <MediaContext.Provider
            value={{
                createMediaContext,
                editingMediaContext,
                getMediaContext,
                deleteMediaContext,
            }}
        >
            {children}
        </MediaContext.Provider>
    );
}

// Hook to access the context
export function useMediaContext() {
    return useContext(MediaContext);
}