import React, { createContext, useContext, useState } from "react";

// Create a single BlogContext
const BlogContext = createContext();

// BlogProvider to manage all context logic and pass as props
export function BlogProvider({ children }) {
    // State for creating blogs
    const [formData, setFormData] = useState({ title: "", content: "" });

    const createBlogContext = {
        formData,
        setFormData,
        resetForm: () => setFormData({ title: "", content: "" }),
    };

    // State for editing blogs
    const [editingBlog, setEditingBlog] = useState(null);

    const editingBlogContext = {
        editingBlog,
        setEditingBlog,
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