import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import {
    addMedia,
    setMedia,
    setComments,
    addComment,
    updateComment,
    deleteComment,
} from "../reducer/action";

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
                    headers: { 
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                dispatch(addMedia(response.data));
            } catch (error) {
                console.error("Error creating media:", error);
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
        fetchMedia: async (page = 1, perPage = 12, { signal } = {}) => {
            try {
                const response = await api.get("/api/media", {
                    params: { page, perPage },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
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
                const response = await api.get(`/api/media/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                return response.data;
            } catch (error) {
                console.error("Error fetching media by ID:", error);
                throw error;
            }
        },
    };

    // Comment context
    const commentContext = {
        fetchComments: async (mediaId) => {
            try {
                const response = await api.get(`/api/auth/comments/${mediaId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                dispatch(setComments(mediaId, response.data.data));
                return response.data;
            } catch (error) {
                console.error("Error fetching comments:", error);
                throw error;
            }
        },
        createComment: async (mediaId, text, timestamp) => {
            try {
                const response = await api.post(
                    "/api/auth/comments",
                    { media1_id: mediaId, text, timestamp },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                dispatch(addComment(mediaId, response.data));
                return response.data;
            } catch (error) {
                console.error("Error creating comment:", error);
                throw error;
            }
        },
        updateComment: async (commentId, text, timestamp) => {
            try {
                const response = await api.put(
                    `/api/auth/comments/${commentId}`,
                    { text, timestamp },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                dispatch(updateComment(commentId, response.data));
                return response.data;
            } catch (error) {
                console.error("Error updating comment:", error);
                throw error;
            }
        },
        deleteComment: async (commentId) => {
            try {
                await api.delete(`/api/auth/comments/${commentId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                dispatch(deleteComment(commentId));
            } catch (error) {
                console.error("Error deleting comment:", error);
                throw error;
            }
        },
    };

    return (
        <MediaContext.Provider
            value={{
                createMediaContext,
                getMediaContext,
                commentContext,
            }}
        >
            {children}
        </MediaContext.Provider>
    );
}

export function useMediaContext() {
    return useContext(MediaContext);
}