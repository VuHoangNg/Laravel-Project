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

    const buildCommentTree = (comments) => {
        const commentMap = new Map();
        const tree = [];

        comments.forEach((comment) => {
            comment.children = [];
            commentMap.set(comment.id, comment);
        });

        comments.forEach((comment) => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.children.push(comment);
                } else {
                    tree.push(comment);
                }
            } else {
                tree.push(comment);
            }
        });
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

    const commentContext = {
        fetchComments: async (mediaId, { page = 1, per_page = 5 } = {}) => {
            console.log("Fetching comments for mediaId:", mediaId, "with page:", page, "per_page:", per_page);
            try {
                const response = await api.get(`/api/core/media/${mediaId}/comments`, {
                    params: { page, per_page },
                    headers: {
                        Authorization: `Bearer ${getCookie("token")}`,
                    },
                });
                console.log("API response:", response.data);
                const commentTree = buildCommentTree(response.data.data);
                dispatch(setComments(mediaId, commentTree));
                return {
                    data: commentTree,
                    total: response.data.total || response.data.data.length,
                    current_page: response.data.current_page || page,
                    per_page: response.data.per_page || per_page,
                };
            } catch (error) {
                console.error("Error fetching comments:", error);
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
                const response = await api.post("/api/core/comments", payload, {
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
                    `/api/core/comments/${commentId}`,
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
                await api.delete(`/api/core/comments/${commentId}`, {
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