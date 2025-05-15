import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Button,
    Input,
    Space,
    Divider,
    Spin,
    Skeleton,
    Form,
} from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { APPEND_COMMENTS, ADD_COMMENT } from "../reducer/action";
import CommentItem from "./CommentItem";

const { Title } = Typography;
const { TextArea } = Input;

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

const CommentSidebar = ({
    showCommentSplitter,
    commentSiderWidth,
    selectedMedia,
    commentForm,
    handleCommentSubmit,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
    videoTime,
    currentUserId,
    commentLoading,
    commentContext,
    commentId,
    contentHeight,
}) => {
    const dispatch = useDispatch();
    const scrollableDivRef = useRef(null);
    const isMounted = useRef(false);
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
    const [singleComment, setSingleComment] = useState(null);
    const [expandedComments, setExpandedComments] = useState(new Set());
    const [form] = Form.useForm();
    const PAGE_SIZE = 10;
    const scrollPositionRef = useRef(0);

    // Calculate heights for comment section
    const titleHeight = 40; // Height of "Comments" title
    const formHeight = 150; // Increased to ensure form is fully visible
    const padding = 16; // Adjusted padding for balance
    const commentsHeight = contentHeight - titleHeight - formHeight - padding * 2;

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!isMounted.current) return;

        // Reset states when selectedMedia.id changes or sidebar is closed
        if (!showCommentSplitter || (selectedMedia?.id !== lastMediaId && lastMediaId !== null)) {
            setSingleComment(null);
            setHighlightedCommentId(null);
            setExpandedComments(new Set());
            setPage(1);
            setHasMore(true);
            setLoadedPages(new Set());
        }

        // Update lastMediaId when selectedMedia.id changes
        if (selectedMedia?.id && selectedMedia.id !== lastMediaId) {
            setLastMediaId(selectedMedia.id);
        }
    }, [selectedMedia?.id, lastMediaId]);

    const toggleExpandComment = (commentId) => {
        if (!isMounted.current) return;
        setExpandedComments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const fetchSingleComment = async () => {
        setLoading(true);
        try {
            const commentData = await commentContext.fetchCommentById(commentId);
            if (commentData && isMounted.current) {
                const commentTree = commentData.parent
                    ? [
                          {
                              ...commentData.parent,
                              children: [{ ...commentData, children: [] }],
                          },
                      ]
                    : [{ ...commentData, children: [] }];
                setSingleComment(commentTree);
                setHighlightedCommentId(parseInt(commentId));
                setExpandedComments(
                    new Set([commentData.parent?.id || commentData.id])
                );
                setTimeout(() => {
                    if (isMounted.current) setHighlightedCommentId(null);
                }, 3000);
            }
        } catch (error) {
            console.error("Error fetching single comment:", error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => {
        if (!isMounted.current || !commentId || !showCommentSplitter) return;
        fetchSingleComment();
    }, [commentId, showCommentSplitter, commentContext]);

    const loadMoreComments = async (reset = false) => {
        if (loading || !selectedMedia?.id || !hasMore || commentId) {
            return;
        }
        const targetPage = reset ? 1 : page;
        if (loadedPages.has(targetPage)) {
            setPage((prev) => prev + 1);
            return;
        }
        setLoading(true);

        if (scrollableDivRef.current && !reset) {
            scrollPositionRef.current = scrollableDivRef.current.scrollTop;
        }

        try {
            const response = await commentContext.fetchComments(
                selectedMedia.id,
                {
                    page: targetPage,
                    per_page: PAGE_SIZE,
                }
            );
            if (!response || !response.data) {
                console.warn(`Invalid response for page ${targetPage}`);
                if (isMounted.current) setHasMore(false);
                return;
            }
            if (response.data.length === 0) {
                console.warn(`No comments returned for page ${targetPage}`);
                if (isMounted.current) setHasMore(false);
                return;
            }

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

            if (isMounted.current) {
                dispatch({
                    type: APPEND_COMMENTS,
                    payload: {
                        mediaId: selectedMedia.id,
                        comments: newTree,
                    },
                });

                setLoadedPages((prev) => new Set(prev).add(targetPage));
                setHasMore(response.current_page <= response.last_page);
                setPage((prev) => {
                    const nextPage = targetPage + 1;
                    return nextPage;
                });
            }

            if (scrollableDivRef.current && !reset) {
                scrollableDivRef.current.scrollTop = scrollPositionRef.current;
            }
        } catch (error) {
            console.error(
                "Error loading comments:",
                error.response || error.message
            );
            if (isMounted.current) setHasMore(false);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleReplyClick = (comment) => {
        if (!isMounted.current) return;
        setReplyingTo(comment);
    };

    const handleReplySubmit = async (payload) => {
        try {
            const response = await commentContext.createComment(
                selectedMedia.id,
                payload.comment,
                videoTime,
                payload.parent_id || null
            );
            if (response && response.data && isMounted.current) {
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
                                username:
                                    response.data.user?.username ||
                                    "Current User",
                                avatar_url:
                                    response.data.user?.avatar_url || null,
                            },
                            timestamp: videoTime,
                            formatted_timestamp:
                                response.data.formatted_timestamp ||
                                new Date().toISOString(),
                            created_at:
                                response.data.created_at ||
                                new Date().toISOString(),
                            children: [],
                        },
                    },
                });
                if (payload.parent_id) {
                    setExpandedComments((prev) =>
                        new Set(prev).add(payload.parent_id)
                    );
                }
                form.resetFields();
            } else {
                console.warn(
                    "No comment data in response, cannot dispatch ADD_COMMENT"
                );
            }
        } catch (error) {
            console.error(
                "Error submitting comment:",
                error.response || error.message
            );
        }
    };

    return (
        showCommentSplitter && (
            <div
                style={{
                    width: `${commentSiderWidth}px`,
                    backgroundColor: "rgba(28, 37, 38, 0.95)",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: `${padding}px`, // Added padding for balance
                    position: "relative",
                    backdropFilter: "blur(10px)",
                    overflowX: "hidden",
                    overflowY: "auto",
                    height: contentHeight,
                    flexShrink: 0,
                    boxSizing: "border-box", // Ensure padding is included in width
                }}
            >
                {selectedMedia ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%", // Ensure the container takes full width
                        }}
                    >
                        <Title
                            level={4}
                            style={{ color: "#fff", marginBottom: `${padding}px`, height: titleHeight }}
                        >
                            Comments
                        </Title>
                        <div
                            ref={scrollableDivRef}
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                marginBottom: `${padding}px`,
                                minHeight: commentsHeight,
                                width: "100%",
                            }}
                            id="scrollableCommentDiv"
                        >
                            {commentLoading || (commentId && loading) ? (
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
                            ) : commentId && singleComment ? (
                                singleComment.map((comment) => (
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
                                        expandedComments={expandedComments}
                                        toggleExpandComment={
                                            toggleExpandComment
                                        }
                                    />
                                ))
                            ) : comments.length > 0 ? (
                                <InfiniteScroll
                                    dataLength={comments.length}
                                    next={() => {
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
                                            expandedComments={
                                                expandedComments
                                            }
                                            toggleExpandComment={
                                                toggleExpandComment
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
                            style={{ flexShrink: 0, height: formHeight, width: "100%" }} // Ensure full width
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
                                style={{ width: "100%", marginBottom: "8px" }} // Adjusted margin
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
                                        width: "100%", // Ensure TextArea takes full width
                                        boxSizing: "border-box", // Prevent padding issues
                                        padding: "8px", // Added padding for better appearance
                                    }}
                                />
                            </Form.Item>
                            <Form.Item style={{ width: "100%", marginBottom: 0 }}>
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
        )
    );
};

export default CommentSidebar;