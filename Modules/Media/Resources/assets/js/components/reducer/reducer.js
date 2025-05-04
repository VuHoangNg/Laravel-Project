import {
    SET_MEDIA,
    ADD_MEDIA,
    UPDATE_MEDIA,
    DELETE_MEDIA,
    SET_COMMENTS,
    ADD_COMMENT,
    UPDATE_COMMENT,
    DELETE_COMMENT,
} from "../reducer/action";

const initialState = {
    media: {
        data: [],
        current_page: 1,
        per_page: 12,
        total: 0,
        last_page: 1,
    },
    comments: {}, // Store comments as { [mediaId]: [comment, ...] }
};

const mediaReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_MEDIA:
            return {
                ...state,
                media: action.payload,
            };
        case ADD_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: [action.payload, ...state.media.data],
                    total: state.media.total + 1,
                },
            };
        case UPDATE_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: state.media.data.map((item) =>
                        item.id === action.payload.id ? action.payload : item
                    ),
                },
            };
        case DELETE_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: state.media.data.filter(
                        (item) => item.id !== action.payload
                    ),
                    total: state.media.total - 1,
                },
                comments: {
                    ...state.comments,
                    [action.payload]: undefined, // Clear comments for deleted media
                },
            };
        case SET_COMMENTS:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [action.payload.mediaId]: action.payload.comments,
                },
            };
        case ADD_COMMENT:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [action.payload.mediaId]: [
                        action.payload.comment,
                        ...(state.comments[action.payload.mediaId] || []),
                    ],
                },
            };
        case UPDATE_COMMENT:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    // Update comment in all mediaId arrays where it exists
                    ...Object.keys(state.comments).reduce((acc, mediaId) => {
                        acc[mediaId] = state.comments[mediaId].map((comment) =>
                            comment.id === action.payload.commentId
                                ? action.payload.comment
                                : comment
                        );
                        return acc;
                    }, {}),
                },
            };
        case DELETE_COMMENT:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    // Remove comment from all mediaId arrays
                    ...Object.keys(state.comments).reduce((acc, mediaId) => {
                        acc[mediaId] = state.comments[mediaId].filter(
                            (comment) => comment.id !== action.payload
                        );
                        return acc;
                    }, {}),
                },
            };
        default:
            return state;
    }
};

export default mediaReducer;