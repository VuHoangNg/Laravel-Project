export const SET_MEDIA = "media/setMedia";
export const ADD_MEDIA = "media/addMedia";
export const UPDATE_MEDIA = "media/updateMedia";
export const DELETE_MEDIA = "media/deleteMedia";
export const SET_COMMENTS = "comments/setComments";
export const ADD_COMMENT = "comments/addComment";
export const UPDATE_COMMENT = "comments/updateComment";
export const DELETE_COMMENT = "comments/deleteComment";

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

// Comment Action Creators
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