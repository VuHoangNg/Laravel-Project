const initialState = {
    token: localStorage.getItem("auth_token") || null,
    user: null, // Add user data if needed
};

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case "login":
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.username || null, // Adjust based on your API response
            };
        case "register":
            return {
                ...state,
                user: action.payload.name || null, // Adjust based on your API response
            };
        case "logout":
            localStorage.removeItem("auth_token"); // Clear token on logout
            return {
                ...state,
                token: null,
                user: null,
            };
        case "auth/setToken":
            return { ...state, token: action.payload };
        case "auth/clearToken":
            return { ...state, token: null };
        default:
            return state;
    }
}
