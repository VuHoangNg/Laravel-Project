import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Layout,
    Button,
    Form,
    message,
    Drawer,
    Tabs,
    ConfigProvider,
    Flex,
} from "antd";
import { useMediaContext } from "../context/MediaContext";
import MainContent from "../page/MainContent";
import PreviewSidebar from "../page/PreviewSidebar";
import CommentSidebar from "../page/CommentSidebar";
import CreateMediaModal from "../page/CreateMediaModal";
import EditCommentModal from "../page/EditCommentModal";
import Script from "../../../../../../Script/Resources/assets/js";

const { TabPane } = Tabs;

const MediaContent = ({ api }) => {
    const navigate = useNavigate();
    const { createMediaContext, getMediaContext, commentContext } = useMediaContext();
    const { resetForm, createMedia } = createMediaContext;
    const { isModalOpen, openModal, closeModal, fetchMedia, fetchMediaById } = getMediaContext;
    const [form] = Form.useForm();
    const [commentForm] = Form.useForm();
    const [editCommentForm] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [videoTime, setVideoTime] = useState(0);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeTab, setActiveTab] = useState("asset");
    const videoRef = useRef(null);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    const commentId = searchParams.get("comment");
    const mediaId = searchParams.get("id");
    const scriptId = searchParams.get("script_id");
    const feedbackId = searchParams.get("feedback");
    const isMounted = useRef(false);
    const fetchedMediaId = useRef(null);
    const fetchedCommentId = useRef(null);

    const drawerWidth = Math.min(1600, window.innerWidth * 1);
    const commentSiderWidth = Math.min(Math.max(500, drawerWidth * 0.5), 500);
    const previewSiderWidth = drawerWidth - commentSiderWidth;

    const drawerHeaderHeight = 64;
    const tabsHeight = 48;
    const padding = 24;
    const contentHeight = window.innerHeight - drawerHeaderHeight - tabsHeight - padding;

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(";").shift();
            return cookieValue;
        }
        return null;
    };

    const loadMedia = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);
        try {
            await fetchMedia(page, perPage);
        } catch (err) {
            if (isMounted.current) {
                setError(err.response?.data?.message || "Failed to load media.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const fetchMediaByIdForPreview = async (mediaId) => {
        if (!mediaId || !isMounted.current || fetchedMediaId.current === mediaId) return;
        fetchedMediaId.current = mediaId;
        setLoading(true);
        setError(null);
        try {
            const mediaData = await fetchMediaById(mediaId);
            if (mediaData && isMounted.current) {
                setSelectedMedia(mediaData);
                setDrawerOpen(true);
                if (scriptId) {
                    setActiveTab("script");
                }
            } else {
                setError("Media not found.");
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err.response?.data?.message || "Failed to load media.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const fetchCommentsForMedia = useCallback(
        async (mediaId) => {
            if (!mediaId || !isMounted.current || fetchedCommentId.current === mediaId) return;
            fetchedCommentId.current = mediaId;
            setCommentLoading(true);
            try {
                await commentContext.fetchComments(mediaId);
            } catch (err) {
                if (isMounted.current) {
                    setError(err.response?.data?.message || "Failed to load comments.");
                }
            } finally {
                if (isMounted.current) {
                    setCommentLoading(false);
                }
            }
        },
        [commentContext]
    );

    const handleMediaUpdate = useCallback(
        (updatedMedia) => {
            if (updatedMedia && updatedMedia.id === selectedMedia?.id) {
                setSelectedMedia(updatedMedia);
            }
        },
        [selectedMedia]
    );

    const handleOpenCreate = () => {
        openModal();
        form.resetFields();
        resetForm();
        setSearchParams({
            action: "create",
            page: page.toString(),
            perPage: perPage.toString(),
        });
    };

    const handleCardClick = (media) => {
        setSearchParams({ id: media.id });
    };

    const handlePageChange = (newPage, newPerPage) => {
        setSearchParams({
            page: newPage.toString(),
            perPage: newPerPage.toString(),
        });
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setSelectedMedia(null);
        setActiveTab("asset");
        setSearchParams({});
        fetchedMediaId.current = null;
        fetchedCommentId.current = null;
    };

    const handleCommentSubmit = async (values) => {
        try {
            await commentContext.createComment(selectedMedia.id, values.comment, videoTime, null);
            commentForm.resetFields();
            message.success("Comment posted successfully");
            fetchedCommentId.current = null;
            fetchCommentsForMedia(selectedMedia.id);
        } catch (error) {
            message.error("Failed to post comment");
        }
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        editCommentForm.setFieldsValue({ comment: comment.text });
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e.length > 0 ? e[0].originFileObj : null;
        }
        return e && e.fileList && e.fileList.length > 0 && e.fileList[0].originFileObj;
    };

    const handleEditCommentSubmit = async (values) => {
        try {
            await commentContext.updateComment(editingCommentId, values.comment, videoTime);
            setEditingCommentId(null);
            editCommentForm.resetFields();
            message.success("Comment updated successfully");
            fetchedCommentId.current = null;
            fetchCommentsForMedia(selectedMedia.id);
        } catch (error) {
            message.error("Failed to update comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await commentContext.deleteComment(commentId);
            message.success("Comment deleted successfully");
            fetchedCommentId.current = null;
            fetchCommentsForMedia(selectedMedia.id);
        } catch (error) {
            message.error("Failed to delete comment");
        }
    };

    const handleTimestampClick = (timestamp) => {
        if (videoRef.current) {
            videoRef.current.currentTime = timestamp;
            videoRef.current.play();
        }
    };

    const handleCancel = () => {
        closeModal();
        form.resetFields();
        setSearchParams({
            page: page.toString(),
            perPage: perPage.toString(),
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            if (values.file) {
                formData.append("file", values.file);
            }
            await createMedia({ title: values.title, file: values.file });
            message.success("Media created successfully");
            closeModal();
            form.resetFields();
            await fetchMedia(page, perPage);
        } catch (error) {
            message.error("Failed to create media");
        } finally {
            setLoading(false);
        }
    };

    const handleVideoPause = () => {
        if (videoRef.current) {
            setVideoTime(videoRef.current.currentTime);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        loadMedia();
        const userId = getCookie("id");
        if (userId) {
            setCurrentUserId(parseInt(userId));
        } else {
            message.warning("Please log in to access all features");
            window.location.href = "/auth/login";
        }
        return () => {
            isMounted.current = false;
        };
    }, [page, perPage]);

    useEffect(() => {
        if (mediaId && fetchedMediaId.current !== mediaId) fetchMediaByIdForPreview(mediaId);
        if (selectedMedia?.id && fetchedCommentId.current !== selectedMedia.id) fetchCommentsForMedia(selectedMedia.id);
    }, [mediaId, selectedMedia, fetchMediaByIdForPreview, fetchCommentsForMedia]);

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        itemColor: "#e0e0e0",
                        itemActiveColor: "#1890ff",
                        itemSelectedColor: "#1890ff",
                        inkBarColor: "#1890ff",
                        inkBarHeight: 3,
                        cardPadding: "8px 16px",
                        fontSize: 16,
                        itemHoverColor: "#fff",
                    },
                },
            }}
        >
            <Layout
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#1C2526",
                    flexDirection: "row",
                    position: "relative",
                }}
            >
                <MainContent
                    loading={loading}
                    error={error}
                    setError={setError}
                    fetchMedia={fetchMedia}
                    handleOpenCreate={handleOpenCreate}
                    handleCardClick={handleCardClick}
                    page={page}
                    perPage={perPage}
                    contentWidth={window.innerWidth}
                    handlePageChange={handlePageChange}
                />
            </Layout>
            <Drawer
                title=""
                placement="right"
                width={drawerWidth}
                onClose={handleDrawerClose}
                open={drawerOpen}
                bodyStyle={{
                    padding: 0,
                    overflowY: "hidden",
                    background: "rgba(28, 37, 38, 0.95)",
                    boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.5)",
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    defaultActiveKey="asset"
                    tabPosition="top"
                    style={{ height: contentHeight }}
                    tabBarStyle={{
                        background: "#1C2526",
                        padding: "0 8px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        overflowX: "hidden",
                    }}
                >
                    <TabPane tab="Asset" key="asset">
                        <Flex
                            style={{
                                height: contentHeight,
                                overflowY: "hidden",
                                overflowX: "hidden",
                            }}
                        >
                            <PreviewSidebar
                                showSplitter={true}
                                siderWidth={previewSiderWidth}
                                selectedMedia={selectedMedia}
                                videoRef={videoRef}
                                handleVideoPause={handleVideoPause}
                                onMediaUpdate={handleMediaUpdate}
                                contentHeight={contentHeight}
                            />
                            <CommentSidebar
                                showCommentSplitter={true}
                                commentSiderWidth={commentSiderWidth}
                                selectedMedia={selectedMedia}
                                commentForm={commentForm}
                                handleCommentSubmit={handleCommentSubmit}
                                handleEditComment={handleEditComment}
                                handleDeleteComment={handleDeleteComment}
                                handleTimestampClick={handleTimestampClick}
                                videoTime={videoTime}
                                currentUserId={currentUserId}
                                commentLoading={commentLoading}
                                commentContext={commentContext}
                                commentId={commentId}
                                contentHeight={contentHeight}
                            />
                        </Flex>
                    </TabPane>
                    <TabPane tab="Script" key="script">
                        <Flex
                            style={{
                                height: contentHeight,
                                overflowY: "hidden",
                                overflowX: "auto",
                                width: drawerWidth,
                            }}
                        >
                            <Script
                                api={api}
                                contentHeight={contentHeight}
                                media1_id={selectedMedia?.id}
                                scriptId={scriptId}
                                feedbackId={feedbackId}
                            />
                        </Flex>
                    </TabPane>
                </Tabs>
            </Drawer>
            <CreateMediaModal
                isModalOpen={isModalOpen}
                handleCancel={handleCancel}
                handleSubmit={handleSubmit}
                form={form}
                loading={loading}
                normFile={normFile}
            />
            <EditCommentModal
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                editCommentForm={editCommentForm}
                handleEditCommentSubmit={handleEditCommentSubmit}
            />
        </ConfigProvider>
    );
};

export default MediaContent;