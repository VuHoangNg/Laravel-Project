const initialState = {
    token: localStorage.getItem("auth_token") || null,
    blogs: [], // Add blogs to state
};

export default function rootReducer(state = initialState, action) {
    switch (action.type) {
        // Auth Cases
        case "auth/setToken":
            return { ...state, token: action.payload };
        case "auth/clearToken":
            return { ...state, token: null };

        // Blog Cases
        case "blogs/setBlogs":
            return { ...state, blogs: action.payload };
        case "blogs/addBlog":
            return { ...state, blogs: [...state.blogs, action.payload] };
        case "blogs/updateBlog":
            return {
                ...state,
                blogs: state.blogs.map((blog) =>
                    blog.id === action.payload.id ? action.payload : blog
                ),
            };
        case "blogs/deleteBlog":
            return {
                ...state,
                blogs: state.blogs.filter((blog) => blog.id !== action.payload),
            };

        default:
            return state;
    }
}