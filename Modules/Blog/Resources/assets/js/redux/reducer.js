const initialState = {
    blogs: {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    },
    media: {
        data: [],
        current_page: 1,
        per_page: 6,
        total: 0,
        last_page: 1,
    },
};

export default function blogReducer(state = initialState, action) {
    switch (action.type) {
        case "blogs/setBlogs":
            return {
                ...state,
                blogs: action.payload, // Update state.blogs directly
            };
        case "blogs/addBlog":
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: [action.payload, ...state.blogs.data],
                    total: state.blogs.total + 1,
                },
            };
        case "blogs/updateBlog":
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: state.blogs.data.map((blog) =>
                        blog.id === action.payload.id ? action.payload : blog
                    ),
                },
            };
        case "blogs/deleteBlog":
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: state.blogs.data.filter(
                        (blog) => blog.id !== action.payload
                    ),
                    total: state.blogs.total - 1,
                },
            };
        case "media/setMedia":
            return { ...state, media: action.payload };
        default:
            return state;
    }
}