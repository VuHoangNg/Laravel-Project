export const fetchBlogs = (api) => async (dispatch) => {
    try {
        const response = await api.get("/api/blogs"); // Adjust endpoint as needed
        dispatch({ type: "blogs/setBlogs", payload: response.data });
    } catch (error) {
        console.error("Failed to fetch blogs:", error);
        throw error;
    }
};

export const createBlog = (data, api) => async (dispatch) => {
    try {
        const response = await api.post("/api/blogs", data); // Adjust endpoint
        dispatch({ type: "blogs/addBlog", payload: response.data });
    } catch (error) {
        console.error("Failed to create blog:", error);
        throw error;
    }
};

export const updateBlog = (id, data, api) => async (dispatch) => {
    try {
        const response = await api.put(`/api/blogs/${id}`, data); // Adjust endpoint
        dispatch({ type: "blogs/updateBlog", payload: response.data });
    } catch (error) {
        console.error("Failed to update blog:", error);
        throw error;
    }
};

export const deleteBlog = (id, api) => async (dispatch) => {
    try {
        await api.delete(`/api/blogs/${id}`); // Adjust endpoint
        dispatch({ type: "blogs/deleteBlog", payload: id });
    } catch (error) {
        console.error("Failed to delete blog:", error);
        throw error;
    }
};