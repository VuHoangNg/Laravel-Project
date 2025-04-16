import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";

// Create a single BlogContext
const BlogContext = createContext();

// BlogProvider to manage all context logic and API calls
export function BlogProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating blogs
    const [formData, setFormData] = useState({ title: "", content: "" });

    const createBlogContext = {
        formData,
        setFormData,
        resetForm: () => setFormData({ title: "", content: "" }),
        createBlog: async (data) => {
            try {
                const response = await api.post("/api/blogs", data); // Adjust endpoint
                dispatch({ type: "blogs/addBlog", payload: response.data });
            } catch (error) {
                console.error("Failed to create blog:", error);
                throw error;
            }
        },
    };

    // State for editing blogs
    const [editingBlog, setEditingBlog] = useState(null);

    const editingBlogContext = {
        editingBlog,
        setEditingBlog,
        updateBlog: async (id, data) => {
            try {
                const response = await api.put(`/api/blogs/${id}`, data); // Adjust endpoint
                dispatch({ type: "blogs/updateBlog", payload: response.data });
            } catch (error) {
                console.error("Failed to update blog:", error);
                throw error;
            }
        },
    };

    // State for getting blogs (modal control)
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getBlogContext = {
        isModalOpen,
        openModal: (blog = null) => {
            setEditingBlog(blog);
            setIsModalOpen(true);
        },
        closeModal: () => {
            setEditingBlog(null);
            setIsModalOpen(false);
        },
        fetchBlogs: async () => {
            try {
                const response = await api.get("/api/blogs"); // Adjust endpoint
                dispatch({ type: "blogs/setBlogs", payload: response.data });
            } catch (error) {
                console.error("Failed to fetch blogs:", error);
                throw error;
            }
        },
    };

    // State for deleting blogs
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);

    const deleteBlogContext = {
        isDeleteModalOpen,
        blogToDelete,
        openDeleteModal: (blogId) => {
            setBlogToDelete(blogId);
            setIsDeleteModalOpen(true);
        },
        closeDeleteModal: () => {
            setBlogToDelete(null);
            setIsDeleteModalOpen(false);
        },
        deleteBlog: async (id) => {
            try {
                await api.delete(`/api/blogs/${id}`); // Adjust endpoint
                dispatch({ type: "blogs/deleteBlog", payload: id });
            } catch (error) {
                console.error("Failed to delete blog:", error);
                throw error;
            }
        },
    };

    return (
        <BlogContext.Provider
            value={{
                createBlogContext,
                editingBlogContext,
                getBlogContext,
                deleteBlogContext,
            }}
        >
            {children}
        </BlogContext.Provider>
    );
}

// Hook to access the context
export function useBlogContext() {
    return useContext(BlogContext);
}