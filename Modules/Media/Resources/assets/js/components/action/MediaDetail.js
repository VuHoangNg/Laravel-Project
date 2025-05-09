import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Typography,
    Spin,
    Alert,
    Button,
    Form,
    Input,
    Space,
    Avatar,
    Modal,
} from "antd";
import { useMediaContext } from "../context/MediaContext";
import {
    CommentOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import ImageWithSkeleton from "../../../../../../Core/Resources/assets/js/components/page/SkeletonImage";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";
import { useSelector } from "react-redux";

const { Title, Text: AntText } = Typography;
const { TextArea } = Input;

// Toggle debug logs
const DEBUG = false;

// Function to build comment tree
const buildCommentTree = (comments) => {
    const mapRepliesToChildren = (comment) => ({
        ...comment,
        children: (comment.replies || []).map((reply) =>
            mapRepliesToChildren(reply)
        ),
    });

    const tree = comments.map((comment) => mapRepliesToChildren(comment));

    const sortComments = (commentList) => {
        commentList.sort((a, b) => a.timestamp - b.timestamp);
        commentList.forEach((comment) => {
            if (comment.children && comment.children.length > 0) {
                sortComments(comment.children);
            }
        });
    };

    sortComments(tree);
    return tree;
};

const CommentItem = ({
    comment,
    currentUserId,
    onReplyClick,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
    highlightedCommentId,
}) => {
    const isOwner =
        currentUserId && Number(currentUserId) === Number(comment.user.id);

    return (
        <div
            id={`comment-${comment.id}`}
            style={{
                marginBottom: "12px",
                backgroundColor:
                    highlightedCommentId === comment.id
                        ? "rgba(24, 144, 255, 0.2)"
                        : "transparent",
                transition: "background-color 0.3s",
                padding: "8px",
                borderRadius: "4px",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
                <Avatar
                    src={comment.user.avatar_url}
                    style={{ marginRight: 8 }}
                >
                    {comment.user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ color: "#fff", flex: 1 }}>
                    <AntText
                        style={{
                            fontSize: 12,
                            opacity: 0.7,
                            display: "block",
                            color: "white",
                        }}
                    >
                        {comment.parent_id && (
                            <span style={{ marginRight: 8 }}>↳</span>
                        )}
                        {comment.user.username} at{" "}
                        {comment.formatted_timestamp ? (
                            <Button
                                type="link"
                                style={{ padding: 0, color: "#1890ff" }}
                                onClick={() =>
                                    handleTimestampClick(comment.timestamp)
                                }
                            >
                                {comment.formatted_timestamp}
                            </Button>
                        ) : (
                            "N/A"
                        )}
                    </AntText>
                    <AntText style={{ color: "white" }}>{comment.text}</AntText>
                    <div style={{ marginTop: 4 }}>
                        <Space size="small">
                            {isOwner && (
                                <>
                                    <Button
                                        type="link"
                                        icon={<EditOutlined />}
                                        onClick={() =>
                                            handleEditComment(comment)
                                        }
                                        aria-label="Edit comment"
                                    />
                                    <Button
                                        type="link"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                            handleDeleteComment(comment.id)
                                        }
                                        aria-label="Delete comment"
                                    />
                                </>
                            )}
                            <Button
                                type="link"
                                icon={<CommentOutlined />}
                                onClick={() => onReplyClick(comment)}
                                aria-label="Reply"
                            >
                                Reply
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>

            {comment.children?.length > 0 && (
                <div style={{ marginLeft: 40, marginTop: 12 }}>
                    {comment.children.map((child) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            currentUserId={currentUserId}
                            onReplyClick={onReplyClick}
                            handleEditComment={handleEditComment}
                            handleDeleteComment={handleDeleteComment}
                            handleTimestampClick={handleTimestampClick}
                            highlightedCommentId={highlightedCommentId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

function MediaDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
    const [error, setError] = useState(null);
    const [commentForm] = Form.useForm();
    const [replyForm] = Form.useForm();
    const [videoTime, setVideoTime] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const videoRef = useRef(null);
    const sentinelRef = useRef(null);
    const lastFetchedPage = useRef(0);
    const isMounted = useRef(false);

    const { getMediaContext, commentContext } = useMediaContext();
    const { fetchMediaById } = getMediaContext;
    const { fetchComments, createComment, updateComment, deleteComment } =
        commentContext;

    const mediaId = id.split("&")[0];
    const commentId = id.includes("&comment=")
        ? id.split("&comment=")[1]
        : null;

    const comments = useSelector(
        (state) => state.media.comments[mediaId] || []
    );
    const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

    const getCookie = useCallback((name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return null;
    }, []);

    const debounce = useCallback((func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }, []);

    const fetchMediaData = useCallback(async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);
        try {
            const mediaData = await fetchMediaById(mediaId);
            if (isMounted.current) {
                setMedia(mediaData);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load media details. Please try again."
                );
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [fetchMediaById, mediaId]);

    const fetchCommentsForMedia = useCallback(
        async (page = 1) => {
            if (!isMounted.current || lastFetchedPage.current === page) return;
            lastFetchedPage.current = page;
            setCommentLoading(page === 1);
            setFetchMoreLoading(page > 1);
            try {
                if (DEBUG) {
                    console.log(
                        `Fetching comments for mediaId: ${mediaId}, page: ${page}, existing comments: ${comments.length}`
                    );
                }
                const { data, total, current_page, per_page } = await fetchComments(
                    mediaId,
                    {
                        page,
                        per_page: 5,
                    }
                );
                if (isMounted.current) {
                    const existingIds = new Set(comments.map((c) => c.id));
                    const uniqueNewComments = data.filter(
                        (c) => !existingIds.has(c.id)
                    );
                    if (DEBUG) {
                        console.log(
                            `Fetched ${uniqueNewComments.length} new comments, Total: ${total}, Page: ${current_page}`
                        );
                    }
                    setTotalComments(total);
                    setCurrentPage(current_page);
                    setHasMore(
                        uniqueNewComments.length > 0 &&
                            current_page * per_page < total
                    );
                }
            } catch (err) {
                if (isMounted.current) {
                    setError(
                        err.response?.data?.message || "Failed to load comments."
                    );
                }
            } finally {
                if (isMounted.current) {
                    setCommentLoading(false);
                    setFetchMoreLoading(false);
                }
            }
        },
        [fetchComments, mediaId, comments]
    );

    const debouncedFetchComments = useMemo(
        () => debounce(fetchCommentsForMedia, 300),
        [fetchCommentsForMedia]
    );

    const fetchMoreComments = useCallback(async () => {
        if (!hasMore || fetchMoreLoading) return;
        await debouncedFetchComments(currentPage + 1);
    }, [hasMore, fetchMoreLoading, debouncedFetchComments, currentPage]);

    // Combined initialization effect
    useEffect(() => {
        isMounted.current = true;
        const initialize = async () => {
            lastFetchedPage.current = 0;
            const userId = getCookie("id");
            if (!userId) {
                setError("Please log in to access all features");
                navigate("/auth/login");
                return;
            }
            setCurrentUserId(parseInt(userId));
            await fetchMediaData();
            await debouncedFetchComments(1);
        };
        initialize();
        return () => {
            isMounted.current = false;
            lastFetchedPage.current = 0;
        };
    }, [fetchMediaData, debouncedFetchComments, getCookie, navigate, mediaId]);

    // Infinite scroll effect
    useEffect(() => {
        if (!sentinelRef.current || !hasMore || commentLoading || fetchMoreLoading)
            return;
        const observerCallback = (entries) => {
            if (entries[0].isIntersecting && isMounted.current) {
                fetchMoreComments();
            }
        };
        const observer = new IntersectionObserver(observerCallback, {
            threshold: 0.5,
        });
        observer.observe(sentinelRef.current);
        return () => {
            if (sentinelRef.current) {
                observer.unobserve(sentinelRef.current);
            }
        };
    }, [hasMore, commentLoading, fetchMoreLoading, fetchMoreComments]);

    // Comment highlighting effect
    useEffect(() => {
        if (!commentId || commentLoading) return;
        const findCommentInTree = (comments, targetId) => {
            for (const comment of comments) {
                if (comment.id === parseInt(targetId)) return comment;
                if (comment.children) {
                    const found = findCommentInTree(comment.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        let retryCount = 0;
        const MAX_RETRIES = 3; // Reduced retries to minimize spam

        const tryHighlightComment = () => {
            const commentExists = findCommentInTree(commentTree, commentId);
            if (DEBUG) {
                console.log(
                    `Highlighting comment ID: ${commentId}, Exists: ${!!commentExists}, Tree size: ${commentTree.length}`
                );
            }

            if (commentExists) {
                const targetId = parseInt(commentId);
                setHighlightedCommentId(targetId);
                setTimeout(() => {
                    const commentElement = document.querySelector(
                        `#comment-${commentId}`
                    );
                    if (commentElement) {
                        commentElement.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });
                        setTimeout(() => {
                            setHighlightedCommentId(null);
                        }, 5000);
                    }
                }, 100);
            } else if (
                hasMore &&
                !fetchMoreLoading &&
                retryCount < MAX_RETRIES
            ) {
                retryCount++;
                if (DEBUG) {
                    console.log(
                        `Retry ${retryCount}/${MAX_RETRIES}: Fetching more comments for comment ID ${commentId}`
                    );
                }
                fetchMoreComments();
                setTimeout(tryHighlightComment, 1000);
            } else if (retryCount >= MAX_RETRIES) {
                setError(
                    `Could not find comment with ID ${commentId} after ${MAX_RETRIES} attempts.`
                );
            }
        };

        tryHighlightComment();
    }, [commentId, commentTree, hasMore, fetchMoreLoading, commentLoading, fetchMoreComments]);

    const handleBack = useCallback(() => {
        navigate(`/media?page=1&perPage=12`);
    }, [navigate]);

    const handleCommentSubmit = useCallback(
        async (values) => {
            try {
                await createComment(mediaId, values.comment, videoTime, null);
                commentForm.resetFields();
                await debouncedFetchComments(1);
            } catch (error) {
                let errorMessage = "Failed to post comment";
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = "Please log in to post a comment";
                        navigate("/auth/login");
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
        },
        [createComment, mediaId, videoTime, commentForm, navigate, debouncedFetchComments]
    );

    const handleReplySubmit = useCallback(
        async (values) => {
            try {
                await createComment(
                    mediaId,
                    values.reply,
                    videoTime,
                    replyTo?.id
                );
                replyForm.resetFields();
                setIsReplyModalOpen(false);
                setReplyTo(null);
                await debouncedFetchComments(1);
            } catch (error) {
                let errorMessage = "Failed to post reply";
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = "Please log in to post a reply";
                        navigate("/auth/login");
                    } else if (error.response.status === 429) {
                        errorMessage =
                            "Too many reply attempts. Please try again later.";
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
        },
        [createComment, mediaId, videoTime, replyTo, replyForm, navigate, debouncedFetchComments]
    );

    const handleEditComment = useCallback((comment) => {
        // Placeholder: Implement edit modal or inline editing if needed
    }, []);

    const handleDeleteComment = useCallback(
        async (commentId) => {
            try {
                await deleteComment(commentId);
                await debouncedFetchComments(1);
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
        },
        [deleteComment, navigate, debouncedFetchComments]
    );

    const handleReplyClick = useCallback(
        (comment) => {
            setReplyTo(comment);
            setIsReplyModalOpen(true);
            replyForm.setFieldsValue({
                reply: `@${comment.user.username} `,
            });
        },
        [replyForm]
    );

    const handleReplyModalCancel = useCallback(() => {
        setIsReplyModalOpen(false);
        setReplyTo(null);
        replyForm.resetFields();
    }, [replyForm]);

    const handleTimestampClick = useCallback(
        (timestamp) => {
            if (videoRef.current) {
                videoRef.current.seekTo(timestamp);
            }
        },
        []
    );

    const handleVideoPause = useCallback((currentTime) => {
        setVideoTime(currentTime);
    }, []);

    return (
        <div
            style={{
                padding: "24px",
                backgroundColor: "#1C2526",
                minHeight: "100vh",
            }}
        >
            <Title level={2} style={{ color: "#fff" }}>
                Media Detail
            </Title>
            <Button
                onClick={handleBack}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#fff",
                    transition: "background-color 0.3s",
                }}
            >
                Back to Media List
            </Button>
            {loading && (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <Spin size="large" />
                </div>
            )}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}
            {media && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ color: "#fff" }}>
                            Preview
                        </Title>
                        {media.status === 0 ? (
                            <div style={{ color: "#fff" }}>
                                Media is processing...
                            </div>
                        ) : media.url && media.url.includes(".m3u8") ? (
                            <VideoPlayer
                                src={media.url}
                                style={{ width: "100%", maxHeight: 400 }}
                                ref={videoRef}
                                onPause={handleVideoPause}
                            />
                        ) : (
                            <ImageWithSkeleton
                                src={
                                    media.thumbnail_url ||
                                    media.url ||
                                    "https://placehold.co/150x100?text=No+Preview"
                                }
                                alt={media.title}
                                style={{ width: "100%", maxHeight: 400 }}
                                onError={() =>
                                    console.log(
                                        "Image load error for:",
                                        media.thumbnail_url || media.url
                                    )
                                }
                            />
                        )}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ color: "#fff" }}>
                            Comments
                        </Title>
                        {commentLoading ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    margin: "20px 0",
                                }}
                            >
                                <Spin tip="Loading comments..." />
                            </div>
                        ) : commentTree.length > 0 ? (
                            <div
                                style={{
                                    background: "rgba(28, 37, 38, 0.95)",
                                    padding: "16px",
                                    borderRadius: "8px",
                                }}
                            >
                                {commentTree.map((comment) => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        currentUserId={currentUserId}
                                        onReplyClick={handleReplyClick}
                                        handleEditComment={handleEditComment}
                                        handleDeleteComment={
                                            handleDeleteComment
                                        }
                                        handleTimestampClick={
                                            handleTimestampClick
                                        }
                                        highlightedCommentId={
                                            highlightedCommentId
                                        }
                                    />
                                ))}
                                <div
                                    ref={sentinelRef}
                                    style={{ height: "20px" }}
                                />
                                {fetchMoreLoading && (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            margin: "20px 0",
                                        }}
                                    >
                                        <Spin tip="Loading more comments..." />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Typography
                                style={{ color: "#fff", fontSize: "16px" }}
                            >
                                No comments yet.
                            </Typography>
                        )}
                        <Form
                            form={commentForm}
                            onFinish={handleCommentSubmit}
                            style={{ marginTop: 16 }}
                        >
                            <Form.Item
                                label={
                                    <span style={{ color: "white" }}>
                                        {`Commenting at ${Math.floor(
                                            videoTime / 60
                                        )
                                            .toString()
                                            .padStart(2, "0")}:${Math.floor(
                                            videoTime % 60
                                        )
                                            .toString()
                                            .padStart(2, "0")}`}
                                    </span>
                                }
                                name="comment"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter a comment",
                                    },
                                ]}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder={`Comment at ${Math.floor(
                                        videoTime / 60
                                    )
                                        .toString()
                                        .padStart(2, "0")}:${Math.floor(
                                        videoTime % 60
                                    )
                                        .toString()
                                        .padStart(2, "0")}`}
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.1)",
                                        color: "#e0e0e0",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{
                                        width: "100%",
                                        borderRadius: 8,
                                    }}
                                >
                                    Post
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                    <Modal
                        title={`Reply to ${replyTo?.user.username || "Comment"}`}
                        open={isReplyModalOpen}
                        onCancel={handleReplyModalCancel}
                        footer={null}
                        centered
                        width={400}
                    >
                        <Form
                            form={replyForm}
                            onFinish={handleReplySubmit}
                            style={{ marginTop: 16 }}
                        >
                            <Form.Item
                                name="reply"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter your reply",
                                    },
                                ]}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder={`Reply to ${
                                        replyTo?.user.username || "comment"
                                    }...`}
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.1)",
                                        color: "#e0e0e0",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ borderRadius: 8 }}
                                    >
                                        Submit
                                    </Button>
                                    <Button
                                        onClick={handleReplyModalCancel}
                                        style={{ borderRadius: 8 }}
                                    >
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </>
            )}
        </div>
    );
}

export default MediaDetail;