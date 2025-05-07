import { createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../api/api";
export const SET_COMMENTS = "core/setComments";
export const ADD_COMMENT = "core/addComment";
export const UPDATE_COMMENT = "core/updateComment";
export const DELETE_COMMENT = "core/deleteComment";
export const CLEAR_COMMENTS = "core/clearComments";

export const setComments = (mediaId, comments) => ({
    type: SET_COMMENTS,
    payload: { mediaId, comments },
});

export const addComment = (mediaId, comment) => ({
    type: ADD_COMMENT,
    payload: { mediaId, comment },
});

export const updateComment = (commentId, comment) => ({
    type: UPDATE_COMMENT,
    payload: { commentId, comment },
});

export const deleteComment = (commentId) => ({
    type: DELETE_COMMENT,
    payload: commentId,
});

export const clearComments = (mediaId) => ({
    type: CLEAR_COMMENTS,
    payload: mediaId,
});

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop().split(';').shift();
        return cookieValue;
    }
    return null;
};

export const fetchComments = createAsyncThunk(
    'core/fetchComments',
    async ({ mediaId, page }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/core/comments/${mediaId}`, {
                params: { page, per_page: 10 },
                headers: {
                    Authorization: `Bearer ${getCookie("token")}`,
                },
            });
            return { mediaId, comments: response.data.comments, has_more: response.data.has_more };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);