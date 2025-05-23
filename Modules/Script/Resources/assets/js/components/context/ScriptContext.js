import React, { createContext, useContext, useState, useCallback } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import {
    ADD_FEEDBACK,
    ADD_SCRIPT,
    APPEND_FEEDBACKS,
    DELETE_FEEDBACK,
    DELETE_SCRIPT,
    SET_FEEDBACKS,
    SET_SCRIPTS,
    UPDATE_FEEDBACK,
    UPDATE_SCRIPT,
} from "../reducer/action";

// Script Context
const ScriptContext = createContext();

export const useScriptContext = () => {
    const context = useContext(ScriptContext);
    if (!context) {
        throw new Error("useScriptContext must be used within a ScriptProvider");
    }
    return context;
};

// Script Provider
export const ScriptProvider = ({ api, children }) => {
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScript, setEditingScript] = useState(null);
    const [scriptToDelete, setScriptToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    // Script Operations
    const fetchScripts = useCallback(
        async (media1_id) => {
            if (!media1_id) return;
            try {
                const response = await api.get(`/api/script/media/${media1_id}`);
                const responseScriptData = response.data.data;
                if (!Array.isArray(responseScriptData)) {
                    throw new Error(
                        "Invalid response structure: script data is not an array"
                    );
                }
                const formattedData = {
                    data: responseScriptData,
                    current_page: 1,
                    per_page: 10,
                    total: responseScriptData.length,
                    last_page: 1,
                };
                dispatch({ type: SET_SCRIPTS, payload: formattedData });
            } catch (error) {
                message.error("Failed to fetch scripts.");
            }
        },
        [api, dispatch]
    );

    const createScript = async (values) => {
        const { media1_id } = values;
        if (!media1_id) throw new Error("media1_id is required");
        try {
            const response = await api.post(`/api/script/media/${media1_id}`, values);
            const responseScriptData = response.data.data;
            if (!responseScriptData || !responseScriptData.id) {
                throw new Error("Invalid response structure: script data missing");
            }
            dispatch({ type: ADD_SCRIPT, payload: responseScriptData });
            message.success("Script created successfully!");
        } catch (error) {
            message.error("Failed to create script.");
        }
    };

    const updateScript = async (id, values) => {
        const { media1_id, ...scriptData } = values;
        if (!media1_id) throw new Error("media1_id is required");
        try {
            const response = await api.put(`/api/script/media/${media1_id}/${id}`, scriptData);
            if (response.status === 200 || response.status === 201) {
                const responseScriptData = response.data.data;
                if (!responseScriptData || !responseScriptData.id) {
                    throw new Error("Invalid response structure: script data missing");
                }
                dispatch({ type: UPDATE_SCRIPT, payload: responseScriptData });
                message.success("Script updated successfully!");
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            message.error("Failed to update script.");
        }
    };

    const deleteScript = async (id, media1_id) => {
        if (!media1_id) throw new Error("media1_id is required");
        try {
            const response = await api.delete(`/api/script/media/${media1_id}/${id}`);
            dispatch({ type: DELETE_SCRIPT, payload: id });
            message.success("Script deleted successfully!");
        } catch (error) {
            message.error("Failed to delete script.");
        }
    };

    // Import and Export Operations
    const importScripts = async (media1_id, file) => {
        if (!media1_id || !file) throw new Error("media1_id and file are required");
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post(`/api/script/media/${media1_id}/import`, formData, {
                headers: {
                    'Authorization': `Bearer ${getCookie("token")}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                await fetchScripts(media1_id);
                message.success(response.data.message || "Scripts imported successfully!");
                return { successCount: response.data.success_count, errors: [] };
            } else if (response.status === 422) {
                const { success_count, errors } = response.data;
                if (!Array.isArray(errors) || errors.length === 0) {
                    message.error(`Imported ${success_count} scripts, but some rows failed validation. No specific errors provided.`);
                    await fetchScripts(media1_id);
                    return { successCount: success_count, errors: [] };
                }
                const errorMessage = errors.map(err => {
                    if (!err.row || !err.errors) {
                        return `Row ${err.row || 'unknown'}: Validation error`;
                    }
                    return `Row ${err.row}: ${Object.entries(err.errors).map(([field, messages]) => {
                        // Map est_time to estimated time for display
                        const displayField = field === 'est_time' ? 'estimated time' : field;
                        return `${displayField}: ${messages.join(', ')}`;
                    }).join('; ')}`;
                }).join('\n');
                message.error({
                    content: `Imported ${success_count} scripts, but some rows failed:\n${errorMessage}`,
                    duration: 10,
                    style: { whiteSpace: 'pre-wrap' },
                });
                await fetchScripts(media1_id);
                return { successCount: success_count, errors };
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to import scripts.";
            const successCount = error.response?.data?.success_count || 0;
            const errors = error.response?.data?.errors || [];
            if (Array.isArray(errors) && errors.length > 0) {
                const errorMessageText = errors.map(err => {
                    if (!err.row || !err.errors) {
                        return `Row ${err.row || 'unknown'}: Validation error`;
                    }
                    return `Row ${err.row}: ${Object.entries(err.errors).map(([field, messages]) => {
                        // Map est_time to estimated time for display
                        const displayField = field === 'est_time' ? 'estimated time' : field;
                        return `${displayField}: ${messages.join(', ')}`;
                    }).join('; ')}`;
                }).join('\n');
                message.error({
                    content: `Imported ${successCount} scripts, but some rows failed:\n${errorMessageText}`,
                    duration: 10,
                    style: { whiteSpace: 'pre-wrap' },
                });
            } else {
                message.error(errorMessage);
            }
            await fetchScripts(media1_id);
            throw error;
        }
    };

    const exportScripts = async (media1_id) => {
        if (!media1_id) throw new Error("media1_id is required");
        try {
            const response = await api.get(`/api/script/media/${media1_id}/export`, {
                responseType: 'blob',
                headers: { 'Authorization': `Bearer ${getCookie("token")}` },
            });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scripts_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            message.error("Failed to export scripts.");
            throw error;
        }
    };

    // Feedback Operations
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(";").shift() : null;
    };

    const buildFeedbackTree = (feedbacks) => {
        const feedbackMap = new Map();
        const tree = [];

        feedbacks.forEach((feedback) => {
            feedback.children = feedback.children || [];
            feedbackMap.set(feedback.id, feedback);
        });

        feedbacks.forEach((feedback) => {
            if (feedback.parent_id) {
                const parent = feedbackMap.get(feedback.parent_id);
                if (parent) {
                    parent.children.push(feedback);
                } else {
                    tree.push(feedback);
                }
            } else {
                tree.push(feedback);
            }
        });

        const sortFeedbacks = (feedbackList) => {
            feedbackList.sort(
                (a, b) =>
                    new Date(b.created_at || new Date()) -
                    new Date(a.created_at || new Date())
            );
            feedbackList.forEach((feedback) => {
                if (feedback.children && feedback.children.length > 0) {
                    sortFeedbacks(feedback.children);
                }
            });
        };

        sortFeedbacks(tree);
        return tree;
    };

    const fetchFeedbacks = async (script_id, { page = 1, per_page = 5 } = {}) => {
        try {
            const response = await api.get(`/api/script/feedbacks/${script_id}`, {
                params: { page, per_page },
                headers: { Authorization: `Bearer ${getCookie("token")}` },
            });
            const feedbackTree = buildFeedbackTree(response.data.data);
            dispatch(
                page === 1
                    ? {
                          type: SET_FEEDBACKS,
                          payload: { scriptId: script_id, feedbacks: feedbackTree },
                      }
                    : {
                          type: APPEND_FEEDBACKS,
                          payload: { scriptId: script_id, feedbacks: feedbackTree },
                      }
            );
            return {
                data: feedbackTree,
                total: response.data.total,
                current_page: response.data.current_page,
                per_page: response.data.per_page,
                last_page: response.data.last_page,
            };
        } catch (error) {
            message.error("Failed to fetch feedbacks.");
            throw error;
        }
    };

    const fetchFeedbackById = async (feedbackId) => {
        try {
            const response = await api.get(`/api/script/feedback/${feedbackId}`, {
                headers: { Authorization: `Bearer ${getCookie("token")}` },
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching feedback by ID:", error);
            message.error("Failed to fetch feedback.");
            throw error;
        }
    };

    const createFeedback = async (script_id, text, timestamp, parentId = null) => {
        try {
            const payload = { script_id, text, timestamp, ...(parentId && { parent_id: parentId }) };
            const response = await api.post("/api/script/feedback", payload, {
                headers: { Authorization: `Bearer ${getCookie("token")}`, "Content-Type": "application/json" },
            });
            dispatch({ type: ADD_FEEDBACK, payload: { scriptId: script_id, feedback: response.data.data } });
            message.success("Feedback created successfully!");
            return response.data.data;
        } catch (error) {
            console.error("Error creating feedback:", error);
            message.error("Failed to create feedback.");
            throw error;
        }
    };

    const updateFeedback = async (script_id, feedbackId, text, timestamp = 0) => {
        try {
            const payload = { text };
            if (timestamp !== undefined) payload.timestamp = timestamp;
            const response = await api.put(`/api/script/feedback/${feedbackId}`, payload, {
                headers: { Authorization: `Bearer ${getCookie("token")}`, "Content-Type": "application/json" },
            });
            dispatch({ type: UPDATE_FEEDBACK, payload: { scriptId: script_id, feedback: response.data.data } });
            message.success("Feedback updated successfully!");
            return response.data.data;
        } catch (error) {
            console.error("Error updating feedback:", error);
            message.error("Failed to update feedback.");
            throw error;
        }
    };

    const deleteFeedback = async (script_id, feedbackId) => {
        try {
            await api.delete(`/api/script/feedback/${feedbackId}`, {
                headers: { Authorization: `Bearer ${getCookie("token")}` },
            });
            dispatch({ type: DELETE_FEEDBACK, payload: { scriptId: script_id, feedbackId } });
            message.success("Feedback deleted successfully!");
        } catch (error) {
            console.error("Error deleting feedback:", error);
            message.error("Failed to delete feedback.");
            throw error;
        }
    };

    // Modal and Form Handlers
    const openModal = (script = null) => {
        setEditingScript(script);
        setFormData(script || {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingScript(null);
        setFormData({});
    };

    const openDeleteModal = (id) => {
        setScriptToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setScriptToDelete(null);
    };

    const resetForm = () => {
        setFormData({});
    };

    const value = {
        createScriptContext: { createScript, resetForm, formData },
        editingScriptContext: { editingScript, updateScript },
        getScriptContext: { fetchScripts, isModalOpen, openModal, closeModal, importScripts, exportScripts },
        deleteScriptContext: {
            deleteScript: (id, media1_id) => deleteScript(id, media1_id),
            scriptToDelete,
            openDeleteModal,
            closeDeleteModal,
            isDeleteModalOpen,
        },
        feedBackContext: {
            fetchFeedbacks,
            fetchFeedbackById,
            createFeedback,
            updateFeedback,
            deleteFeedback,
            buildFeedbackTree,
        },
    };

    return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
};