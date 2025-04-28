import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { setBlogs, addBlog, updateBlog, deleteBlog } from "../reducer/action";

const BlogContext = createContext();

export function BlogProvider({ children, api }) {
    const dispatch = useDispatch();

    // State for creating blogs
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        media_ids: [],
    });

    const createBlogContext = {
        formData,
        setFormData,
        resetForm: () =>
            setFormData({
                title: "",
                content: "",
                media_ids: [],
            }),
        createBlog: async (data) => {
            try {
                const response = await api.post("/api/blogs", data, {
                    params: { fields: "id,title,content,media" },
                });
                dispatch(addBlog(response.data));
            } catch (error) {
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
                const response = await api.put(`/api/blogs/${id}`, data, {
                    params: { fields: "id,title,content,media" },
                });
                dispatch(updateBlog(response.data));
            } catch (error) {
                throw error;
            }
        },
    };

    // State for getting blogs
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getBlogContext = {
        isModalOpen,
        openModal: (blog = null) => {
            setEditingBlog(blog);
            setIsModalOpen(true);
            if (blog) {
                setFormData({
                    title: blog.title,
                    content: blog.content,
                    media_ids: blog.media ? blog.media.map((m) => m.id) : [],
                });
            }
        },
        closeModal: () => {
            setEditingBlog(null);
            setIsModalOpen(false);
        },
        fetchBlogs: async (page = 1, perPage = 10, options = {}) => {
            try {
                const response = await api.get("/api/blogs", {
                    params: { page, perPage, fields: "id,title,content,media" },
                    ...options,
                });
                dispatch(setBlogs(response.data));
            } catch (error) {
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
                await api.delete(`/api/blogs/${id}`);
                dispatch(deleteBlog(id));
            } catch (error) {
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

export function useBlogContext() {
    return useContext(BlogContext);
}
