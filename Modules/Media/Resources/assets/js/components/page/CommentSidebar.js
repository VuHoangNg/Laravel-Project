import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Button,
    Input,
    Avatar,
    Space,
    Divider,
    Spin,
    Skeleton,
    Form,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    CommentOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { APPEND_COMMENTS, ADD_COMMENT } from "../reducer/action";

const { Title, Text: AntText } = Typography;
const { TextArea } = Input;

// Flatten comments to remove nested children
const flattenComments = (comments) => {
    const flatList = [];
    comments.forEach((comment) => {
        flatList.push({
            ...comment,
            children: undefined,
        });
        if (comment.children && comment.children.length > 0) {
            flatList.push(...flattenComments(comment.children));
        }
    });
    return flatList;
};

// Build comment tree from flat list
const buildCommentTree = (comments) => {
    const topLevel = comments.filter((c) => !c.parent_id);
    const replyMap = {};

    comments.forEach((c) => {
        if (c.parent_id) {
            if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
            replyMap[c.parent_id].push({ ...c });
        }
    });

    const tree = topLevel.map((comment) => ({
        ...comment,
        children: (replyMap[comment.id] || []).sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
    }));

    tree.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return tree;
};

const CommentItem = ({
    comment,
    currentUserId,
    onReplyClick,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
    handleReplySubmit,
    replyingTo,
    setReplyingTo,
    highlightedCommentId,
}) => {
    const isOwner =
        currentUserId && Number(currentUserId) === Number(comment.user.id);
    const [replyText, setReplyText] = useState(`@${comment.user.username} `);
    const isReplying = replyingTo?.id === comment.id;

    const handleSubmit = () => {
        if (!replyText.trim()) return;
        const parentId = comment.parent_id ? comment.parent_id : comment.id;
        handleReplySubmit({
            comment: replyText,
            parent_id: parentId,
        });
        setReplyText(`@${comment.user.username} `);
        setReplyingTo(null);
    };

    const handleCancel = () => {
        setReplyText(`@${comment.user.username} `);
        setReplyingTo(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div
            id={`comment-${comment.id}`}
            style={{
                marginBottom: "12px",
                backgroundColor:
                    highlightedCommentId === comment.id
                        ? "rgba(24, 144, 255, 0.2)"
                        : "transparent",
                transition: "background-color 1s",
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
                    {isReplying && (
                        <div
                            style={{
                                marginTop: 12,
                                marginLeft: comment.parent_id ? 40 : 0,
                            }}
                        >
                            <TextArea
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Reply to ${comment.user.username}...`}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    color: "#e0e0e0",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                autoFocus
                            />
                            <Space style={{ marginTop: 8 }}>
                                <Button
                                    type="primary"
                                    onClick={handleSubmit}
                                    style={{ borderRadius: 8 }}
                                    disabled={!replyText.trim()}
                                >
                                    Submit
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    style={{ borderRadius: 8 }}
                                >
                                    Cancel
                                </Button>
                            </Space>
                        </div>
                    )}
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
                            handleReplySubmit={handleReplySubmit}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            highlightedCommentId={highlightedCommentId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentSidebar = ({
    showCommentSplitter,
    commentSiderWidth,
    selectedMedia,
    handleCommentMouseDown,
    handleCommentMouseMove,
    handleCommentMouseUp,
    isResizingComment,
    commentSidebarRef,
    commentForm,
    handleCommentSubmit,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
    videoTime,
    debouncedUpdateContentWidth,
    currentUserId,
    commentLoading,
    commentContext,
    commentId,
}) => {
    const dispatch = useDispatch();
    const commentSplitterRef = useRef(null);
    const comments = useSelector(
        (state) => state.media.comments[selectedMedia?.id] || []
    );
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [lastMediaId, setLastMediaId] = useState(null);
    const [loadedPages, setLoadedPages] = useState(new Set());
    const [form] = Form.useForm();
    const PAGE_SIZE = 5;

    useEffect(() => {
        if (isResizingComment) {
            window.addEventListener("mousemove", handleCommentMouseMove);
            window.addEventListener("mouseup", handleCommentMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleCommentMouseMove);
            window.removeEventListener("mouseup", handleCommentMouseUp);
        };
    }, [isResizingComment, debouncedUpdateContentWidth]);

    useEffect(() => {
        if (!selectedMedia?.id || selectedMedia.id === lastMediaId) return;
        console.log(`useEffect triggered: New mediaId ${selectedMedia.id}, previous: ${lastMediaId}`);
        setPage(1);
        setHasMore(true);
        setLoadedPages(new Set());
        setLastMediaId(selectedMedia.id);
        dispatch({
            type: APPEND_COMMENTS,
            payload: {
                mediaId: selectedMedia.id,
                comments: [],
            },
        }); // Clear comments for new media
        loadMoreComments(true);
    }, [selectedMedia?.id, dispatch]);

    useEffect(() => {
        if (!commentId || !comments.length || !showCommentSplitter) return;

        const flatComments = flattenComments(comments);
        const targetComment = flatComments.find(
            (c) => c.id === parseInt(commentId)
        );

        if (targetComment) {
            setHighlightedCommentId(targetComment.id);
            const commentElement = document.getElementById(
                `comment-${targetComment.id}`
            );
            const scrollableDiv = document.getElementById("scrollableCommentDiv");
            if (commentElement && scrollableDiv) {
                const elementRect = commentElement.getBoundingClientRect();
                const containerRect = scrollableDiv.getBoundingClientRect();
                const scrollTop =
                    scrollableDiv.scrollTop +
                    (elementRect.top - containerRect.top) -
                    containerRect.height / 2 +
                    elementRect.height / 2;
                scrollableDiv.scrollTo({
                    top: scrollTop,
                    behavior: "smooth",
                });
            }

            const timeout = setTimeout(() => {
                setHighlightedCommentId(null);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [commentId, comments, showCommentSplitter]);

    const loadMoreComments = async (reset = false) => {
        if (loading || !selectedMedia?.id || !hasMore) {
            console.log("loadMoreComments skipped:", { loading, mediaId: selectedMedia?.id, hasMore });
            return;
        }
        const targetPage = reset ? 1 : page;
        if (loadedPages.has(targetPage)) {
            console.log(`Page ${targetPage} already loaded, skipping fetch`);
            setPage((prev) => prev + 1);
            return;
        }
        setLoading(true);
        try {
            console.log(
                `Fetching comments for mediaId: ${selectedMedia.id}, page: ${targetPage}, per_page: ${PAGE_SIZE}`
            );
            const response = await commentContext.fetchComments(
                selectedMedia.id,
                {
                    page: targetPage,
                    per_page: PAGE_SIZE,
                }
            );
            console.log("API response:", response);
            if (!response || !response.data) {
                console.warn(`Invalid response for page ${targetPage}`);
                setHasMore(false);
                return;
            }
            if (response.data.length === 0) {
                console.warn(`No comments returned for page ${targetPage}`);
                setHasMore(false);
                return;
            }

            // Combine new comments with existing ones
            const newComments = response.data;
            const currentComments = reset ? [] : comments;
            const flatCurrent = flattenComments(currentComments);
            const flatNew = flattenComments(newComments);
            const combined = [
                ...flatCurrent.filter(
                    (c) => !flatNew.some((n) => n.id === c.id)
                ),
                ...flatNew,
            ];
            const newTree = buildCommentTree(combined);

            // Dispatch APPEND_COMMENTS
            dispatch({
                type: APPEND_COMMENTS,
                payload: {
                    mediaId: selectedMedia.id,
                    comments: newTree,
                },
            });
            console.log(
                `Dispatched APPEND_COMMENTS for mediaId: ${selectedMedia.id}, comments:`,
                newTree
            );

            setLoadedPages((prev) => new Set(prev).add(targetPage));
            setHasMore(response.current_page < (response.last_page || 1));
            console.log(
                `hasMore: ${
                    response.current_page < (response.last_page || 1)
                }, current_page: ${response.current_page}, last_page: ${
                    response.last_page || 1
                }, loadedPages:`,
                [...loadedPages, targetPage]
            );
            if (!reset) {
                setPage((prev) => {
                    const nextPage = prev + 1;
                    console.log(`Incrementing page to: ${nextPage}`);
                    return nextPage;
                });
            } else {
                setPage(2);
                console.log("Reset page set to 2");
            }
        } catch (error) {
            console.error(
                "Error loading comments:",
                error.response || error.message
            );
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const handleReplyClick = (comment) => {
        setReplyingTo(comment);
    };

    const handleReplySubmit = async (payload) => {
        try {
            console.log("Submitting comment:", payload);
            const response = await commentContext.createComment(
                selectedMedia.id,
                payload.comment,
                videoTime,
                payload.parent_id || null
            );
            console.log("createComment response:", response);
            if (response && response.data) {
                // Manually dispatch ADD_COMMENT with the new comment data
                dispatch({
                    type: ADD_COMMENT,
                    payload: {
                        mediaId: selectedMedia.id,
                        comment: {
                            id: response.data.id,
                            text: payload.comment,
                            parent_id: payload.parent_id || null,
                            user: {
                                id: currentUserId,
                                username: response.data.user?.username || "Current User",
                                avatar_url: response.data.user?.avatar_url || null,
                            },
                            timestamp: videoTime,
                            formatted_timestamp:
                                response.data.formatted_timestamp || new Date().toISOstring(),
                            created_at: response.data.created_at || new Date().toISOString(),
                            children: [],
                        },
                    },
                });
                console.log("Dispatched ADD_COMMENT:", {
                    mediaId: selectedMedia.id,
                    comment: response.data,
                });
            } else {
                console.warn("No comment data in response, cannot dispatch ADD_COMMENT");
            }
            form.resetFields();
        } catch (error) {
            console.error("Error submitting comment:", error.response || error.message);
        }
    };

    return (
        showCommentSplitter && (
            <div style={{ display: "flex", height: "100vh", flexShrink: 0 }}>
                <div
                    ref={commentSplitterRef}
                    style={{
                        width: "5px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        cursor: "col-resize",
                        height: "100%",
                        zIndex: 100,
                        pointerEvents: "auto",
                        transition: "background-color 0.3s",
                    }}
                    onMouseDown={handleCommentMouseDown}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.2)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.1)")
                    }
                />
                <div
                    ref={commentSidebarRef}
                    style={{
                        width: `${commentSiderWidth}px`,
                        backgroundColor: "rgba(28, 37, 38, 0.95)",
                        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "16px",
                        position: "relative",
                        backdropFilter: "blur(10px)",
                        overflowY: "auto",
                        height: "100vh",
                        flexShrink: 0,
                    }}
                >
                    {selectedMedia ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                            }}
                        >
                            <Title
                                level={4}
                                style={{ color: "#fff", marginBottom: "16px" }}
                            >
                                Comments
                            </Title>
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    marginBottom: "16px",
                                }}
                                id="scrollableCommentDiv"
                            >
                                {commentLoading ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        <Spin tip="Loading comments..." />
                                    </div>
                                ) : comments.length > 0 ? (
                                    <InfiniteScroll
                                        dataLength={comments.length}
                                        next={() => {
                                            console.log("InfiniteScroll triggered");
                                            loadMoreComments();
                                        }}
                                        hasMore={hasMore}
                                        loader={
                                            <Skeleton
                                                avatar
                                                paragraph={{ rows: 1 }}
                                                active
                                            />
                                        }
                                        endMessage={
                                            <Divider
                                                plain
                                                style={{ color: "white" }}
                                            >
                                                No more comments 🤐
                                            </Divider>
                                        }
                                        scrollableTarget="scrollableCommentDiv"
                                    >
                                        {comments.map((comment) => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                currentUserId={currentUserId}
                                                onReplyClick={handleReplyClick}
                                                handleEditComment={
                                                    handleEditComment
                                                }
                                                handleDeleteComment={
                                                    handleDeleteComment
                                                }
                                                handleTimestampClick={
                                                    handleTimestampClick
                                                }
                                                handleReplySubmit={
                                                    handleReplySubmit
                                                }
                                                replyingTo={replyingTo}
                                                setReplyingTo={setReplyingTo}
                                                highlightedCommentId={
                                                    highlightedCommentId
                                                }
                                            />
                                        ))}
                                    </InfiniteScroll>
                                ) : (
                                    <Typography
                                        style={{
                                            color: "#fff",
                                            fontSize: "16px",
                                        }}
                                    >
                                        No comments yet.
                                    </Typography>
                                )}
                            </div>
                            <Form
                                form={form}
                                onFinish={(values) => {
                                    handleReplySubmit({
                                        comment: values.comment,
                                    });
                                }}
                                style={{ flexShrink: 0 }}
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
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            <Typography
                                style={{ color: "#fff", fontSize: "16px" }}
                            >
                                No media selected
                            </Typography>
                        </div>
                    )}
                </div>
            </div>
        )
    );
};

export default CommentSidebar;