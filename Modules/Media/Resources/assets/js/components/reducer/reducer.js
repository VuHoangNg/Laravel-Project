import {
    SET_MEDIA,
    ADD_MEDIA,
    UPDATE_MEDIA,
    DELETE_MEDIA,
} from "../reducer/action";

const initialState = {
    media: {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    },
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
            };
        default:
            return state;
    }
};

export default mediaReducer;