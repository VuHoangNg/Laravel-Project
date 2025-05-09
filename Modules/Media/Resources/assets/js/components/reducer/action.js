export const SET_MEDIA = "SET_MEDIA";
export const ADD_MEDIA = "ADD_MEDIA";
export const UPDATE_MEDIA = "UPDATE_MEDIA";
export const DELETE_MEDIA = "DELETE_MEDIA";
export const SET_COMMENTS = "SET_COMMENTS";
export const APPEND_COMMENTS = "APPEND_COMMENTS";
export const ADD_COMMENT = "ADD_COMMENT";
export const UPDATE_COMMENT = "UPDATE_COMMENT";
export const DELETE_COMMENT = "DELETE_COMMENT";

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

export const setComments = (mediaId, comments) => ({
    type: SET_COMMENTS,
    payload: { mediaId, comments },
});

export const appendComments = (mediaId, comments) => ({
    type: APPEND_COMMENTS,
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