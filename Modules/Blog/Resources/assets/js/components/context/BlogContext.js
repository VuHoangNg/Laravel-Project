import React, { createContext, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setBlogs, addBlog, updateBlog, deleteBlog } from "../reducer/action";
import { message } from "antd";

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
        itemsSold: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        views: 0,
        watchedFullVideo: 0,
        chartData: {
            likes: { dates: [], data: [] },
            views: { dates: [], data: [] },
        },
        likesDateFrom: null,
        likesDateTo: null,
        viewsDateFrom: null,
        viewsDateTo: null,
        nearestDate: null,
    });
    const [loading, setLoading] = useState(false); // For import/export
    const [chartLoading, setChartLoading] = useState(false); // For chart data fetching

    const reportBlogContext = {
        reportData,
        loading,
        chartLoading, // Expose chartLoading
        fetchReportData: async (
            blogId,
            likesDateFrom = null,
            likesDateTo = null,
            viewsDateFrom = null,
            viewsDateTo = null
        ) => {
            if (!token) {
                message.warning("Please log in to view reports.");
                return;
            }
            try {
                setChartLoading(true); // Set chart-specific loading
                const params = {};
                if (likesDateFrom) params.likesDateFrom = likesDateFrom;
                if (likesDateTo) params.likesDateTo = likesDateTo;
                if (viewsDateFrom) params.viewsDateFrom = viewsDateFrom;
                if (viewsDateTo) params.viewsDateTo = viewsDateTo;
                const response = await api.get(`/api/blogs/reports/${blogId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });
                const data = response.data;
                setReportData({
                    avgWatchTime: data.avgWatchTime ?? 0,
                    comments: data.comments ?? 0,
                    itemsSold: 0,
                    likes: data.likes ?? 0,
                    saves: data.saves ?? 0,
                    shares: data.shares ?? 0,
                    views: data.views ?? 0,
                    watchedFullVideo: data.watchedFullVideo ?? 0,
                    chartData: {
                        likes: {
                            dates: data.chartData?.likes?.dates || [],
                            data: data.chartData?.likes?.data || [],
                        },
                        views: {
                            dates: data.chartData?.views?.dates || [],
                            data: data.chartData?.views?.data || [],
                        },
                    },
                    likesDateFrom: data.likesDateFrom || null,
                    likesDateTo: data.likesDateTo || null,
                    viewsDateFrom: data.viewsDateFrom || null,
                    viewsDateTo: data.viewsDateTo || null,
                    nearestDate: data.nearestDate || null,
                });
            } catch (error) {
                message.error("Failed to load report data.");
                setReportData({
                    avgWatchTime: 0,
                    comments: 0,
                    itemsSold: 0,
                    likes: 0,
                    saves: 0,
                    shares: 0,
                    views: 0,
                    watchedFullVideo: 0,
                    chartData: {
                        likes: { dates: [], data: [] },
                        views: { dates: [], data: [] },
                    },
                    likesDateFrom: null,
                    likesDateTo: null,
                    viewsDateFrom: null,
                    viewsDateTo: null,
                    nearestDate: null,
                });
            } finally {
                setChartLoading(false); // Reset chart-specific loading
            }
        },
        importReports: async (blogId, file) => {
            if (!token) {
                message.warning("Please log in to import reports.");
                return;
            }
            setLoading(true); // Use global loading for import
            const formData = new FormData();
            formData.append("file", file);

            try {
                await api.post(`/api/blogs/reports/${blogId}/import`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                message.success("Reports imported successfully");
                await reportBlogContext.fetchReportData(blogId); // This will use chartLoading
            } catch (error) {
                message.error(
                    "Import failed: " +
                        (error.response?.data?.error || error.message)
                );
                throw error;
            } finally {
                setLoading(false); // Reset global loading
            }
        },
        exportReports: async (blogId) => {
            if (!token) {
                message.warning("Please log in to export reports.");
                return;
            }
            setLoading(true); // Use global loading for export
            try {
                const response = await api.get(
                    `/api/blogs/reports/${blogId}/export`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: "blob",
                    }
                );
                const url = window.URL.createObjectURL(
                    new Blob([response.data])
                );
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `reports-${blogId}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                message.success("Reports exported successfully");
            } catch (error) {
                message.error(
                    "Export failed: " +
                        (error.response?.data?.error || error.message)
                );
                throw error;
            } finally {
                setLoading(false); // Reset global loading
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