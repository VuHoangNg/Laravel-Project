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
        fetchBlogs: async (page = 1, perPage = 12, options = {}) => {
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
    const [statsLoading, setStatsLoading] = useState(false); // For statistics data fetching
    const [likesLoading, setLikesLoading] = useState(false); // For likes chart data fetching
    const [viewsLoading, setViewsLoading] = useState(false); // For views chart data fetching

    const reportBlogContext = {
        reportData,
        loading,
        statsLoading,
        likesLoading,
        viewsLoading,
        fetchStatisticsData: async (blogId) => {
            if (!token) {
                message.warning("Please log in to view reports.");
                return;
            }
            try {
                setStatsLoading(true);
                const response = await api.get(`/api/blogs/reports/${blogId}/statistics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = response.data || {};
                setReportData((prev) => ({
                    ...prev,
                    avgWatchTime: data.avgWatchTime ?? 0,
                    comments: data.comments ?? 0,
                    likes: data.likes ?? 0,
                    saves: data.saves ?? 0,
                    shares: data.shares ?? 0,
                    views: data.views ?? 0,
                    watchedFullVideo: data.watchedFullVideo ?? 0,
                    nearestDate: data.nearestDate || null,
                }));
            } catch (error) {
                message.error(
                    "Failed to load statistics data: " +
                        (error.response?.data?.error || error.message)
                );
                setReportData((prev) => ({
                    ...prev,
                    avgWatchTime: 0,
                    comments: 0,
                    likes: 0,
                    saves: 0,
                    shares: 0,
                    views: 0,
                    watchedFullVideo: 0,
                    nearestDate: null,
                }));
            } finally {
                setStatsLoading(false);
            }
        },
        fetchLikesChartData: async (blogId, likesDateFrom = null, likesDateTo = null) => {
            if (!token) {
                message.warning("Please log in to view reports.");
                return;
            }
            try {
                setLikesLoading(true);
                const params = {};
                if (likesDateFrom) params.likesDateFrom = likesDateFrom;
                if (likesDateTo) params.likesDateTo = likesDateTo;
                const response = await api.get(`/api/blogs/reports/${blogId}/likes`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });
                const data = response.data || {};
                setReportData((prev) => ({
                    ...prev,
                    chartData: {
                        ...prev.chartData,
                        likes: {
                            dates: Array.isArray(data.likes?.dates) ? data.likes.dates : [],
                            data: Array.isArray(data.likes?.data) ? data.likes.data : [],
                        },
                    },
                    likesDateFrom: data.likesDateFrom || null,
                    likesDateTo: data.likesDateTo || null,
                }));
            } catch (error) {
                message.error(
                    "Failed to load likes chart data: " +
                        (error.response?.data?.error || error.message)
                );
                setReportData((prev) => ({
                    ...prev,
                    chartData: {
                        ...prev.chartData,
                        likes: { dates: [], data: [] },
                    },
                    likesDateFrom: null,
                    likesDateTo: null,
                }));
            } finally {
                setLikesLoading(false);
            }
        },
        fetchViewsChartData: async (blogId, viewsDateFrom = null, viewsDateTo = null) => {
            if (!token) {
                message.warning("Please log in to view reports.");
                return;
            }
            try {
                setViewsLoading(true);
                const params = {};
                if (viewsDateFrom) params.viewsDateFrom = viewsDateFrom;
                if (viewsDateTo) params.viewsDateTo = viewsDateTo;
                const response = await api.get(`/api/blogs/reports/${blogId}/views`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });
                const data = response.data || {};
                setReportData((prev) => ({
                    ...prev,
                    chartData: {
                        ...prev.chartData,
                        views: {
                            dates: Array.isArray(data.views?.dates) ? data.views.dates : [],
                            data: Array.isArray(data.views?.data) ? data.views.data : [],
                        },
                    },
                    viewsDateFrom: data.viewsDateFrom || null,
                    viewsDateTo: data.viewsDateTo || null,
                }));
            } catch (error) {
                message.error(
                    "Failed to load views chart data: " +
                        (error.response?.data?.error || error.message)
                );
                setReportData((prev) => ({
                    ...prev,
                    chartData: {
                        ...prev.chartData,
                        views: { dates: [], data: [] },
                    },
                    viewsDateFrom: null,
                    viewsDateTo: null,
                }));
            } finally {
                setViewsLoading(false);
            }
        },
        importReports: async (blogId, file) => {
            if (!token) {
                message.warning("Please log in to import reports.");
                return;
            }
            setLoading(true);
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
                // Fetch all data after import
                await Promise.all([
                    reportBlogContext.fetchStatisticsData(blogId),
                    reportBlogContext.fetchLikesChartData(blogId),
                    reportBlogContext.fetchViewsChartData(blogId),
                ]);
            } catch (error) {
                message.error(
                    "Import failed: " +
                        (error.response?.data?.error || error.message)
                );
                throw error;
            } finally {
                setLoading(false);
            }
        },
        exportReports: async (blogId) => {
            if (!token) {
                message.warning("Please log in to export reports.");
                return;
            }
            setLoading(true);
            try {
                const response = await api.get(`/api/blogs/reports/${blogId}/export`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
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
                setLoading(false);
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