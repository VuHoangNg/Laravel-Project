const initialState = {
    media: [],
};

export default function mediaReducer(state = initialState, action) {
    switch (action.type) {
        case "media/setMedia":
            return { ...state, media: action.payload };
        case "media/addMedia":
            return { ...state, media: [...state.media, action.payload] };
        case "media/updateMedia":
            return {
                ...state,
                media: state.media.map((item) =>
                    item.id === action.payload.id ? action.payload : item
                ),
            };
        case "media/deleteMedia":
            return {
                ...state,
                media: state.media.filter((item) => item.id !== action.payload),
            };
        default:
            return state;
    }
}
