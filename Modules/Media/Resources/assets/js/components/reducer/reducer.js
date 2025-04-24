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
        case "media/setMedia":
            return {
                ...state,
                media: action.payload,
            };
        case "media/addMedia":
            return {
                ...state,
                media: {
                    ...state.media,
                    data: [action.payload, ...state.media.data],
                    total: state.media.total + 1,
                },
            };
        case "media/updateMedia":
            return {
                ...state,
                media: {
                    ...state.media,
                    data: state.media.data.map((item) =>
                        item.id === action.payload.id ? action.payload : item
                    ),
                },
            };
        case "media/deleteMedia":
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