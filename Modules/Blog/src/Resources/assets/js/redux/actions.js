import { message } from "antd";
import api from "../../../../../../Core/src/Resources/assets/js/api/api";

export const fetchBlogs = () => async (dispatch) => {
    try {
        const response = await api.get("/api/blogs", { skipAuth: true });
        dispatch({ type: "blogs/setBlogs", payload: response.data });
    } catch (error) {
        message.error("Failed to fetch blogs.");
        console.error(error);
    }
};

export const createBlog = (blogData) => async (dispatch) => {
    try {
        const response = await api.post("/api/blogs", blogData);
        dispatch({ type: "blogs/addBlog", payload: response.data });
        message.success("Blog created successfully!");
    } catch (error) {
        message.error("Failed to create blog.");
        console.error(error);
    }
};

export const updateBlog = (id, blogData) => async (dispatch) => {
    try {
        const response = await api.put(`/api/blogs/${id}`, blogData);
        dispatch({ type: "blogs/updateBlog", payload: response.data });
        message.success("Blog updated successfully!");
    } catch (error) {
        message.error("Failed to update blog.");
        console.error(error);
    }
};

export const deleteBlog = (id) => async (dispatch) => {
    try {
        await api.delete(`/api/blogs/${id}`);
        dispatch({ type: "blogs/deleteBlog", payload: id });
        message.success("Blog deleted successfully!");
    } catch (error) {
        message.error("Failed to delete blog.");
        console.error(error);
    }
};
