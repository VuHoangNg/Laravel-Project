import React, { createContext, useContext } from "react";
import { useDispatch } from "react-redux";
import {
    setComments,
    addComment,
    updateComment,
    deleteComment,
    fetchComments,
} from "../reducer/action";

const CoreContext = createContext();

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop().split(';').shift();
        return cookieValue;
    }
    return null;
};

// Function to build a comment tree from a flat list
const buildCommentTree = (comments) => {
    const topLevel = comments.filter((c) => !c.parent_id);
    const replyMap = {};

    comments.forEach((c) => {
        if (c.parent_id) {
            if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
            replyMap[c.parent_id].push({ ...c });
        }
    });

    const tree = topLevel.map((comment) => ({
        ...comment,
        children: (replyMap[comment.id] || []).sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
    }));

    tree.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return tree;
};

export function CoreProvider({ children, api }) {
    const dispatch = useDispatch();

    const commentContext = {
        fetchComments: async (mediaId, page = 1, perPage = 10) => {
            try {
                const response = await dispatch(fetchComments({ mediaId, page })).unwrap();
                const commentTree = buildCommentTree(flattenComments(response.comments));
                dispatch(setComments(mediaId, commentTree));
                return { data: commentTree, has_more: response.has_more };
            } catch (error) {
                console.error("Error fetching comments:", error);
                throw error;
            }
        },
        createComment: async (mediaId, text, timestamp, parentId = null) => {
            try {
                const payload = {
                    media_id: mediaId,
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

    // Flatten nested comments for buildCommentTree
    const flattenComments = (comments) => {
        const flatList = [];
        comments.forEach((comment) => {
            flatList.push({
                ...comment,
                children: undefined,
            });
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach((reply) => {
                    flatList.push({
                        ...reply,
                        children: undefined,
                    });
                });
            }
        });
        return flatList;
    };

    return (
        <CoreContext.Provider value={{ commentContext }}>
            {children}
        </CoreContext.Provider>
    );
}

export function useCoreContext() {
    const context = useContext(CoreContext);
    if (!context) {
        throw new Error("useCoreContext must be used within a CoreProvider");
    }
    return context;
}