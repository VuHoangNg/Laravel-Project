// src/reducer/action.js

// Media Action Types
export const SET_MEDIA = "media/setMedia";
export const ADD_MEDIA = "media/addMedia";
export const UPDATE_MEDIA = "media/updateMedia";
export const DELETE_MEDIA = "media/deleteMedia";

// Media Action Creators
export const setMedia = (media) => ({
    type: SET_MEDIA,
    payload: media,
});

export const addMedia = (media) => ({
    type: ADD_MEDIA,
    payload: media,
});

export const updateMedia = (media) => ({
    type: UPDATE_MEDIA,
    payload: media,
});

export const deleteMedia = (mediaId) => ({
    type: DELETE_MEDIA,
    payload: mediaId,
});