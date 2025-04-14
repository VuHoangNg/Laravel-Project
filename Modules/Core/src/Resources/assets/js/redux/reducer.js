const initialState = {
    token: localStorage.getItem("auth_token") || null,
};

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case "auth/setToken":
            return { ...state, token: action.payload };
        case "auth/clearToken":
            return { ...state, token: null };
        default:
            return state;
    }
}