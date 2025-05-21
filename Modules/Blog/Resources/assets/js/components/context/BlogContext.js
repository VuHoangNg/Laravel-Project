import React, { createContext, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setBlogs, addBlog, updateBlog, deleteBlog } from "../reducer/action";
import { message } from 'antd';

const BlogContext = createContext();

export function BlogProvider({ children, api }) {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

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

    // State for fetching report data
    const [reportData, setReportData] = useState({
        avgWatchTime: 0,
        comments: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        views: 0,
        watchedFullVideo: 0,
        chartData: { dates: [], likes: [], views: [] }
    });
    const [loading, setLoading] = useState(true);

    const reportBlogContext = {
        reportData,
        loading,
        fetchReportData: async (blogId) => {
            if (!token) {
                message.warning('Please log in to view reports.');
                setLoading(false);
                return;
            }
            try {
                const response = await api.get(`/api/blogs/reports/${blogId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data;
                setReportData({
                    ...data,
                    chartData: {
                        dates: data.chartData?.dates || [],
                        likes: data.chartData?.likes || [],
                        views: data.chartData?.views || []
                    }
                });
            } catch (error) {
                message.error('Failed to load report data.');
                setReportData({
                    avgWatchTime: 0,
                    comments: 0,
                    likes: 0,
                    saves: 0,
                    shares: 0,
                    views: 0,
                    watchedFullVideo: 0,
                    chartData: { dates: [], likes: [], views: [] }
                });
            } finally {
                setLoading(false);
            }
        },
        importReports: async (blogId, file) => {
            if (!token) {
                message.warning('Please log in to import reports.');
                return;
            }
            const formData = new FormData();
            formData.append('file', file);

            try {
                await api.post(`/api/blogs/reports/${blogId}/import`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
                message.success('Reports imported successfully');
                // Refresh report data after import
                await reportBlogContext.fetchReportData(blogId);
            } catch (error) {
                message.error('Import failed: ' + (error.response?.data?.error || error.message));
                throw error;
            }
        },
        exportReports: async (blogId) => {
            if (!token) {
                message.warning('Please log in to export reports.');
                return;
            }
            try {
                const response = await api.get(`/api/blogs/reports/${blogId}/export`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `reports-${blogId}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                message.success('Reports exported successfully');
            } catch (error) {
                message.error('Export failed: ' + (error.response?.data?.error || error.message));
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
                reportBlogContext,
            }}
        >
            {children}
        </BlogContext.Provider>
    );
}

export function useBlogContext() {
    return useContext(BlogContext);
}