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

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop().split(';').shift();
        return cookieValue;
    }
    return null;
};

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
                        Authorization: `Bearer ${getCookie("token")}`,
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
                        Authorization: `Bearer ${getCookie("token")}`,
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
                        Authorization: `Bearer ${getCookie("token")}`,
                    },
                });
                return response.data;
            } catch (error) {
                console.error("Error fetching media by ID:", error);
                throw error;
            }
        },
    };

    // Function to build a comment tree from a flat list
    const buildCommentTree = (comments) => {
        const commentMap = new Map();
        const tree = [];

        // First pass: Create a map of comments by ID
        comments.forEach((comment) => {
            comment.children = []; // Initialize children array
            commentMap.set(comment.id, comment);
        });

        // Second pass: Build the tree by linking children to parents
        comments.forEach((comment) => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.children.push(comment);
                } else {
                    // If parent_id doesn't exist (e.g., parent was deleted), treat as top-level
                    tree.push(comment);
                }
            } else {
                tree.push(comment);
            }
        });

        // Sort comments by creation time (assuming a created_at field)
        const sortComments = (commentList) => {
            commentList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            commentList.forEach((comment) => {
                if (comment.children && comment.children.length > 0) {
                    sortComments(comment.children);
                }
            });
        };

        sortComments(tree);
        return tree;
    };

    // Comment context
    const commentContext = {
        fetchComments: async (mediaId) => {
            try {
                const response = await api.get(`/api/auth/comments/${mediaId}`, {
                    headers: {
                        Authorization: `Bearer ${getCookie("token")}`,
                    },
                });
                const commentTree = buildCommentTree(response.data.data);
                dispatch(setComments(mediaId, commentTree));
                return { data: commentTree };
            } catch (error) {
                throw error;
            }
        },
        createComment: async (mediaId, text, timestamp, parentId = null) => {
            try {
                const payload = {
                    media1_id: mediaId,
                    text,
                    timestamp,
                    ...(parentId && { parent_id: parentId }),
                };
                const response = await api.post("/api/auth/comments", payload, {
                    headers: {
                        Authorization: `Bearer ${getCookie("token")}`,
                        "Content-Type": "application/json",
                    },
                });
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
                            Authorization: `Bearer ${getCookie("token")}`,
                            "Content-Type": "application/json",
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
                        Authorization: `Bearer ${getCookie("token")}`,
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
    const context = useContext(MediaContext);
    if (!context) {
        throw new Error("useMediaContext must be used within a MediaProvider");
    }
    return context;
}