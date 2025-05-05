import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout, Button, Form, message } from "antd";
import { useMediaContext } from "../context/MediaContext";
import MainContent from "./MainContent";
import PreviewSidebar from "./PreviewSidebar";
import CommentSidebar from "./CommentSidebar";
import CreateMediaModal from "./CreateMediaModal";
import EditCommentModal from "./EditCommentModal";

const MediaContent = () => {
    const navigate = useNavigate();
    const { createMediaContext, getMediaContext, commentContext } =
        useMediaContext();
    const { resetForm, createMedia } = createMediaContext;
    const { isModalOpen, openModal, closeModal, fetchMedia } = getMediaContext;
    const [form] = Form.useForm();
    const [commentForm] = Form.useForm();
    const [editCommentForm] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false); // New state for comment fetching
    const [error, setError] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [siderWidth, setSiderWidth] = useState(400);
    const [commentSiderWidth, setCommentSiderWidth] = useState(400);
    const [showSplitter, setShowSplitter] = useState(false);
    const [showCommentSplitter, setShowCommentSplitter] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isResizingComment, setIsResizingComment] = useState(false);
    const [contentWidth, setContentWidth] = useState(window.innerWidth);
    const [videoTime, setVideoTime] = useState(0);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const videoRef = useRef(null);
    const sidebarRef = useRef(null);
    const commentSidebarRef = useRef(null);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    const isMounted = useRef(false);
    const tempSiderWidthRef = useRef(400);
    const tempCommentSiderWidthRef = useRef(400);
    const MIN_WIDTH = 400;
    const MAX_PREVIEW_SIDER_WIDTH = 1200;
    const MAX_COMMENT_SIDER_WIDTH = 600;

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(";").shift();
            return cookieValue;
        }
        return null;
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const updateContentWidth = useCallback(() => {
        const totalWidth = window.innerWidth;
        let previewWidth = showSplitter
            ? Math.min(tempSiderWidthRef.current, MAX_PREVIEW_SIDER_WIDTH)
            : 0;
        let commentWidth = showCommentSplitter
            ? Math.min(
                  tempCommentSiderWidthRef.current,
                  MAX_COMMENT_SIDER_WIDTH
              )
            : 0;
        let splitterWidth =
            (showSplitter ? 5 : 0) + (showCommentSplitter ? 5 : 0);
        let contentWidth =
            totalWidth - previewWidth - commentWidth - splitterWidth;

        if (contentWidth < MIN_WIDTH) {
            let excess = MIN_WIDTH - contentWidth;
            if (showCommentSplitter && commentWidth > MIN_WIDTH) {
                let reducible = Math.min(excess, commentWidth - MIN_WIDTH);
                commentWidth -= reducible;
                excess -= reducible;
            }
            if (showSplitter && excess > 0 && previewWidth > MIN_WIDTH) {
                let reducible = Math.min(excess, previewWidth - MIN_WIDTH);
                previewWidth -= reducible;
                excess -= reducible;
            }
            tempCommentSiderWidthRef.current = commentWidth;
            tempSiderWidthRef.current = previewWidth;
            if (commentSidebarRef.current) {
                commentSidebarRef.current.style.width = `${commentWidth}px`;
            }
            if (sidebarRef.current) {
                sidebarRef.current.style.width = `${previewWidth}px`;
            }
            contentWidth = MIN_WIDTH;
        }

        const totalUsedWidth =
            previewWidth + commentWidth + contentWidth + splitterWidth;
        if (totalUsedWidth > totalWidth) {
            let overflow = totalUsedWidth - totalWidth;
            if (showCommentSplitter && commentWidth > MIN_WIDTH) {
                let reducible = Math.min(overflow, commentWidth - MIN_WIDTH);
                commentWidth -= reducible;
                overflow -= reducible;
            }
            if (showSplitter && overflow > 0 && previewWidth > MIN_WIDTH) {
                previewWidth -= Math.min(overflow, previewWidth - MIN_WIDTH);
            }
            tempCommentSiderWidthRef.current = commentWidth;
            tempSiderWidthRef.current = previewWidth;
            if (commentSidebarRef.current) {
                commentSidebarRef.current.style.width = `${commentWidth}px`;
            }
            if (sidebarRef.current) {
                sidebarRef.current.style.width = `${previewWidth}px`;
            }
            contentWidth =
                totalWidth - previewWidth - commentWidth - splitterWidth;
        }

        setContentWidth(contentWidth);
        setSiderWidth(previewWidth);
        setCommentSiderWidth(commentWidth);
    }, [showSplitter, showCommentSplitter]);

    const debouncedUpdateContentWidth = useCallback(
        debounce(updateContentWidth, 100),
        [updateContentWidth]
    );

    useEffect(() => {
        isMounted.current = true;
        loadMedia();
        const userId = getCookie("id");
        if (userId) {
            setCurrentUserId(parseInt(userId));
        } else {
            message.warning("Please log in to access all features");
            navigate("/auth/login");
        }
        updateContentWidth();
        window.addEventListener("resize", updateContentWidth);
        return () => {
            isMounted.current = false;
            window.removeEventListener("resize", updateContentWidth);
        };
    }, [
        page,
        perPage,
        showSplitter,
        showCommentSplitter,
        updateContentWidth,
        navigate,
    ]);

    const loadMedia = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);
        try {
            await fetchMedia(page, perPage);
        } catch (err) {
            if (isMounted.current) {
                setError(
                    err.response?.data?.message || "Failed to load media."
                );
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const fetchCommentsForMedia = async (mediaId) => {
        if (!mediaId) return;
        setCommentLoading(true);
        try {
            await commentContext.fetchComments(mediaId);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load comments.");
        } finally {
            setCommentLoading(false);
        }
    };

    const handlePageChange = (newPage, newPerPage) => {
        setSearchParams({
            page: newPage.toString(),
            perPage: newPerPage.toString(),
        });
        localStorage.setItem("lastMediaPage", newPage);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            await createMedia(values);
            closeModal();
            setSearchParams({
                page: page.toString(),
                perPage: perPage.toString(),
            });
            form.resetFields();
            resetForm();
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([{ name: key, errors: errors[key] }]);
                });
            } else {
                setError(
                    error.response?.data?.message || "Failed to save media."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (values) => {
        if (!selectedMedia) {
            setError("No media selected");
            return;
        }
        try {
            await commentContext.createComment(
                selectedMedia.id,
                values.comment,
                videoTime,
                values.parent_id || null
            );
            commentForm.resetFields();
        } catch (error) {
            let errorMessage = "Failed to post comment";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Please log in to post a comment";
                    navigate("/login");
                } else if (error.response.status === 429) {
                    errorMessage =
                        "Too many comment attempts. Please try again later.";
                } else {
                    const errors = error.response.data.errors || {};
                    errorMessage =
                        errors.media1_id?.[0] ||
                        errors.text?.[0] ||
                        errors.timestamp?.[0] ||
                        errors.parent_id?.[0] ||
                        error.response.data.message ||
                        errorMessage;
                }
            }
            setError(errorMessage);
        }
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        editCommentForm.setFieldsValue({ comment: comment.text });
    };

    const handleEditCommentSubmit = async (values) => {
        try {
            await commentContext.updateComment(
                editingCommentId,
                values.comment,
                videoTime
            );
            setEditingCommentId(null);
            editCommentForm.resetFields();
        } catch (error) {
            let errorMessage = "Failed to update comment";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Please log in to update a comment";
                    navigate("/auth/login");
                } else if (error.response.status === 403) {
                    errorMessage =
                        "You are not authorized to update this comment";
                } else {
                    const errors = error.response.data.errors || {};
                    errorMessage =
                        errors.text?.[0] ||
                        errors.timestamp?.[0] ||
                        error.response.data.message ||
                        errorMessage;
                }
            }
            setError(errorMessage);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await commentContext.deleteComment(commentId);
        } catch (error) {
            let errorMessage = "Failed to delete comment";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Please log in to delete a comment";
                    navigate("/auth/login");
                } else if (error.response.status === 403) {
                    errorMessage =
                        "You are not authorized to delete this comment";
                } else {
                    errorMessage = error.response.data.message || errorMessage;
                }
            }
            setError(errorMessage);
        }
    };

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

    const handleCancel = () => {
        closeModal();
        setSearchParams({
            page: page.toString(),
            perPage: perPage.toString(),
        });
        form.resetFields();
        resetForm();
    };

    const handleCardClick = (record) => {
        setSelectedMedia(record);
        setShowSplitter(true);
        fetchCommentsForMedia(record.id);
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e.length > 0 ? e[0].originFileObj : null;
        }
        return (
            e &&
            e.fileList &&
            e.fileList.length > 0 &&
            e.fileList[0].originFileObj
        );
    };

    const handleMouseDown = () => {
        setIsResizing(true);
    };

    const handleMouseMove = (e) => {
        if (!isResizing) return;
        const newWidth = window.innerWidth - e.clientX;
        let commentWidth = showCommentSplitter
            ? tempCommentSiderWidthRef.current
            : 0;
        let splitterWidth =
            (showSplitter ? 5 : 0) + (showCommentSplitter ? 5 : 0);
        let contentWidth =
            window.innerWidth - newWidth - commentWidth - splitterWidth;

        let constrainedWidth = Math.max(
            MIN_WIDTH,
            Math.min(newWidth, MAX_PREVIEW_SIDER_WIDTH)
        );

        if (contentWidth < MIN_WIDTH) {
            let excess = MIN_WIDTH - contentWidth;
            if (showCommentSplitter && commentWidth > MIN_WIDTH) {
                let reducible = Math.min(excess, commentWidth - MIN_WIDTH);
                commentWidth -= reducible;
                tempCommentSiderWidthRef.current = commentWidth;
                if (commentSidebarRef.current) {
                    commentSidebarRef.current.style.width = `${commentWidth}px`;
                }
                contentWidth += reducible;
            }
            if (contentWidth < MIN_WIDTH && constrainedWidth > MIN_WIDTH) {
                constrainedWidth = Math.max(
                    MIN_WIDTH,
                    constrainedWidth - (MIN_WIDTH - contentWidth)
                );
            }
        }

        tempSiderWidthRef.current = constrainedWidth;
        if (sidebarRef.current) {
            sidebarRef.current.style.width = `${constrainedWidth}px`;
        }
        debouncedUpdateContentWidth();
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        setSiderWidth(tempSiderWidthRef.current);
        setCommentSiderWidth(tempCommentSiderWidthRef.current);
        updateContentWidth();
    };

    const handleCommentMouseDown = () => {
        setIsResizingComment(true);
    };

    const handleCommentMouseMove = (e) => {
        if (!isResizingComment) return;
        const newWidth = window.innerWidth - e.clientX;
        let previewWidth = showSplitter ? tempSiderWidthRef.current : 0;
        let splitterWidth =
            (showSplitter ? 5 : 0) + (showCommentSplitter ? 5 : 0);
        let contentWidth =
            window.innerWidth - newWidth - previewWidth - splitterWidth;

        let constrainedWidth = Math.max(
            MIN_WIDTH,
            Math.min(newWidth, MAX_COMMENT_SIDER_WIDTH)
        );

        if (contentWidth < MIN_WIDTH) {
            let excess = MIN_WIDTH - contentWidth;
            if (showSplitter && previewWidth > MIN_WIDTH) {
                let reducible = Math.min(excess, previewWidth - MIN_WIDTH);
                previewWidth -= reducible;
                tempSiderWidthRef.current = previewWidth;
                if (sidebarRef.current) {
                    sidebarRef.current.style.width = `${previewWidth}px`;
                }
                contentWidth += reducible;
            }
            if (contentWidth < MIN_WIDTH && constrainedWidth > MIN_WIDTH) {
                constrainedWidth = Math.max(
                    MIN_WIDTH,
                    constrainedWidth - (MIN_WIDTH - contentWidth)
                );
            }
        }

        tempCommentSiderWidthRef.current = constrainedWidth;
        if (commentSidebarRef.current) {
            commentSidebarRef.current.style.width = `${constrainedWidth}px`;
        }
        debouncedUpdateContentWidth();
    };

    const handleCommentMouseUp = () => {
        setIsResizingComment(false);
        setCommentSiderWidth(tempCommentSiderWidthRef.current);
        setSiderWidth(tempSiderWidthRef.current);
        updateContentWidth();
    };

    const toggleCommentSplitter = () => {
        if (!showCommentSplitter) {
            const totalWidth = window.innerWidth;
            let previewWidth = showSplitter ? tempSiderWidthRef.current : 0;
            let splitterWidth = (showSplitter ? 5 : 0) + 5;
            let availableWidth =
                totalWidth - previewWidth - splitterWidth - MIN_WIDTH;

            let newCommentWidth = Math.min(
                400,
                Math.max(MIN_WIDTH, availableWidth)
            );
            newCommentWidth = Math.min(
                newCommentWidth,
                MAX_COMMENT_SIDER_WIDTH
            );

            if (
                availableWidth < MIN_WIDTH &&
                showSplitter &&
                previewWidth > MIN_WIDTH
            ) {
                const excess = MIN_WIDTH - availableWidth;
                const reducible = Math.min(excess, previewWidth - MIN_WIDTH);
                previewWidth -= reducible;
                tempSiderWidthRef.current = previewWidth;
                if (sidebarRef.current) {
                    sidebarRef.current.style.width = `${previewWidth}px`;
                }
                availableWidth += reducible;
            }

            newCommentWidth = Math.max(
                MIN_WIDTH,
                Math.min(newCommentWidth, availableWidth)
            );
            tempCommentSiderWidthRef.current = newCommentWidth;
            if (commentSidebarRef.current) {
                commentSidebarRef.current.style.width = `${newCommentWidth}px`;
            }

            setCommentSiderWidth(newCommentWidth);
            setSiderWidth(previewWidth);
            updateContentWidth();

            if (selectedMedia) {
                fetchCommentsForMedia(selectedMedia.id);
            }
        } else {
            tempCommentSiderWidthRef.current = 400;
            setCommentSiderWidth(400);
            updateContentWidth();
        }
        setShowCommentSplitter(!showCommentSplitter);
    };

    const handleTimestampClick = (timestamp) => {
        if (videoRef.current) {
            videoRef.current.seekTo(timestamp);
        }
    };

    const handleVideoPause = (currentTime) => {
        setVideoTime(currentTime);
    };

    const triggerButtonStyle = {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "none",
        color: "#fff",
        transition: "background-color 0.3s",
    };

    const CustomIcon = ({ xPosition }) => (
        <svg
            fill="currentColor"
            height="16"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                clipRule="evenodd"
                d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75ZM6.75 5.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25H6.75Z"
                fillRule="evenodd"
            />
            <rect
                rx="1"
                height="10"
                x={xPosition}
                y="7"
                opacity="1"
                width="2"
            />
        </svg>
    );

    const customTrigger = (
        <div
            style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                display: "flex",
                gap: "8px",
                zIndex: 10,
                maxWidth: "100%",
                overflowX: "hidden",
            }}
        >
            {[
                {
                    label: "Toggle the Sidebar",
                    icon: <CustomIcon xPosition={7} />,
                    onClick: () => setShowSplitter(!showSplitter),
                },
                {
                    label: "Toggle the Comments",
                    icon: <CustomIcon xPosition={15} />,
                    onClick: toggleCommentSplitter,
                },
            ].map(({ label, icon, onClick }, index) => (
                <Button
                    key={index}
                    aria-label={label}
                    type="text"
                    icon={icon}
                    style={triggerButtonStyle}
                    onClick={onClick}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.2)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.1)")
                    }
                />
            ))}
        </div>
    );

    return (
        <>
            <Layout
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#1C2526",
                    flexDirection: "row",
                    position: "relative",
                    overflowX: "hidden",
                }}
            >
                {customTrigger}
                <MainContent
                    loading={loading}
                    error={error}
                    setError={setError}
                    fetchMedia={fetchMedia}
                    handleOpenCreate={handleOpenCreate}
                    handleCardClick={handleCardClick}
                    page={page}
                    perPage={perPage}
                    contentWidth={contentWidth}
                    handlePageChange={handlePageChange}
                />
                <PreviewSidebar
                    showSplitter={showSplitter}
                    siderWidth={siderWidth}
                    selectedMedia={selectedMedia}
                    handleMouseDown={handleMouseDown}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                    isResizing={isResizing}
                    sidebarRef={sidebarRef}
                    videoRef={videoRef}
                    handleVideoPause={handleVideoPause}
                    updateContentWidth={updateContentWidth}
                    debouncedUpdateContentWidth={debouncedUpdateContentWidth}
                />
                <CommentSidebar
                    showCommentSplitter={showCommentSplitter}
                    commentSiderWidth={commentSiderWidth}
                    selectedMedia={selectedMedia}
                    handleCommentMouseDown={handleCommentMouseDown}
                    handleCommentMouseMove={handleCommentMouseMove}
                    handleCommentMouseUp={handleCommentMouseUp}
                    isResizingComment={isResizingComment}
                    commentSidebarRef={commentSidebarRef}
                    commentForm={commentForm}
                    handleCommentSubmit={handleCommentSubmit}
                    handleEditComment={handleEditComment}
                    handleDeleteComment={handleDeleteComment}
                    handleTimestampClick={handleTimestampClick}
                    videoTime={videoTime}
                    updateContentWidth={updateContentWidth}
                    debouncedUpdateContentWidth={debouncedUpdateContentWidth}
                    currentUserId={currentUserId}
                    commentLoading={commentLoading}
                />
            </Layout>
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
        </>
    );
};

export default MediaContent;
