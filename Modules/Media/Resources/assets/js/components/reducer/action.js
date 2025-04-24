export const addMedia = (media) => ({
    type: "media/addMedia",
    payload: media,
});

export const updateMedia = (media) => ({
    type: "media/updateMedia",
    payload: media,
});

export const setMedia = (media) => ({
    type: "media/setMedia",
    payload: media,
});

export const deleteMedia = (mediaId) => ({
    type: "media/deleteMedia",
    payload: mediaId,
});