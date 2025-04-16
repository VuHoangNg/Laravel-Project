import React, { createContext, useContext, useState } from "react";

const BlogContext = createContext();

export function BlogProvider({ children }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);

    const openModal = (blog = null) => {
        setEditingBlog(blog);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingBlog(null);
        setIsModalOpen(false);
    };

    return (
        <BlogContext.Provider
            value={{ isModalOpen, editingBlog, openModal, closeModal }}
        >
            {children}
        </BlogContext.Provider>
    );
}

export function useBlogContext() {
    return useContext(BlogContext);
}