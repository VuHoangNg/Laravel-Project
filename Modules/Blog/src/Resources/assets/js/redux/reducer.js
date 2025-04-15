const initialState = {
    blogs: [],
};

export default function blogReducer(state = initialState, action) {
    switch (action.type) {
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