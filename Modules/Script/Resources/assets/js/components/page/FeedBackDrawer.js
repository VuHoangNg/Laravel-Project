import React, { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography, Button, Input, Divider, Spin, Skeleton, Form } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import FeedBackItem from "./FeedBackItem";
import { useScriptContext } from "../context/ScriptContext";
import { ADD_FEEDBACK, SET_FEEDBACKS } from "../reducer/action";
import { message } from "antd";

const { Title } = Typography;
const { TextArea } = Input;

const FeedBackDrawer = ({
    selectedScript,
    contentHeight,
    currentUserId,
    highlightedFeedbackId,
}) => {
    const { feedBackContext } = useScriptContext();
    const dispatch = useDispatch();
    const scrollableDivRef = useRef(null);
    const isMounted = useRef(false);
    const feedbacks = useSelector(
        (state) => state.scripts.feedbacks[selectedScript?.key] || []
    );
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [loadedPages, setLoadedPages] = useState(new Set());
    const [expandedFeedbacks, setExpandedFeedbacks] = useState(new Set());
    const [form] = Form.useForm();
    const PAGE_SIZE = 10;
    const scrollPositionRef = useRef(0);

    // Guard clause: Don't render if selectedScript is missing
    if (!selectedScript || !selectedScript.key) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#fff",
                }}
            >
                <Typography>No script selected</Typography>
            </div>
        );
    }

    // Calculate heights
    const titleHeight = 40;
    const formHeight = 150;
    const padding = 16;
    const feedbacksHeight =
        contentHeight - titleHeight - formHeight - padding * 2;

    useEffect(() => {
        isMounted.current = true;

        loadInitialFeedbacks();

        // Expand and scroll to highlighted feedback
        if (highlightedFeedbackId && feedbacks.length > 0) {
            const findFeedback = (feedbacks, id) => {
                for (const feedback of feedbacks) {
                    if (feedback.id === parseInt(id)) {
                        return feedback;
                    }
                    if (feedback.children?.length > 0) {
                        const found = findFeedback(feedback.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const feedback = findFeedback(feedbacks, highlightedFeedbackId);
            if (feedback && feedback.parent_id) {
                setExpandedFeedbacks((prev) =>
                    new Set(prev).add(feedback.parent_id)
                );
            }

            setTimeout(() => {
                const element = document.getElementById(
                    `feedback-${highlightedFeedbackId}`
                );
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 100);
        }

        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadInitialFeedbacks = async () => {
        if (selectedScript.key && !highlightedFeedbackId) {
            await loadMoreFeedbacks(true);
        }
    };

    const toggleExpandFeedback = (feedbackId) => {
        if (!isMounted.current) return;
        setExpandedFeedbacks((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(feedbackId)) {
                newSet.delete(feedbackId);
            } else {
                newSet.add(feedbackId);
            }
            return newSet;
        });
    };

    const loadMoreFeedbacks = async (reset = false) => {
        if (loading || !selectedScript.key || !hasMore) {
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
            const response = await feedBackContext.fetchFeedbacks(
                selectedScript.key,
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
                console.warn(`No feedbacks returned for page ${targetPage}`);
                if (isMounted.current) setHasMore(false);
                return;
            }

            if (isMounted.current) {
                setLoadedPages((prev) => new Set(prev).add(targetPage));
                setHasMore(response.current_page < response.last_page);
                setPage((prev) => targetPage + 1);
            }

            if (scrollableDivRef.current && !reset) {
                scrollableDivRef.current.scrollTop = scrollPositionRef.current;
            }
        } catch (error) {
            console.error(
                "Error loading feedbacks:",
                error.response || error.message
            );
            if (isMounted.current) setHasMore(false);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleReplyClick = (feedback) => {
        if (!isMounted.current) return;
        setReplyingTo(feedback);
    };

    const handleReplySubmit = async (payload) => {
        try {
            const response = await feedBackContext.createFeedback(
                selectedScript.key,
                payload.feedback,
                0, // Default timestamp
                payload.parent_id || null
            );
            if (response && isMounted.current) {
                dispatch({
                    type: ADD_FEEDBACK,
                    payload: {
                        scriptId: selectedScript.key,
                        feedback: {
                            ...response,
                            user: {
                                id: currentUserId,
                                username:
                                    response.user?.username || "Current User",
                                avatar_url: response.user?.avatar_url || null,
                                name: response.user?.name || "Current User",
                            },
                            children: [],
                        },
                    },
                });
                if (payload.parent_id) {
                    setExpandedFeedbacks((prev) =>
                        new Set(prev).add(payload.parent_id)
                    );
                }
                form.resetFields();
            }
        } catch (error) {
            console.error(
                "Error submitting feedback:",
                error.response || error.message
            );
        }
    };

    const handleEditFeedback = async (updatedFeedback) => {
        try {
            const response = await feedBackContext.updateFeedback(
                selectedScript.key,
                updatedFeedback.id,
                updatedFeedback.text,
                updatedFeedback.timestamp || 0
            );
            if (response && isMounted.current) {
                dispatch({
                    type: SET_FEEDBACKS,
                    payload: {
                        scriptId: selectedScript.key,
                        feedbacks: feedBackContext.buildFeedbackTree(
                            flattenFeedbacks(feedbacks).map((f) =>
                                f.id === response.id ? response : f
                            )
                        ),
                    },
                });
                message.success("Feedback updated successfully");
            }
        } catch (error) {
            console.error(
                "Error updating feedback:",
                error.response || error.message
            );
            message.error("Failed to update feedback");
        }
    };

    const handleDeleteFeedback = (feedbackId) => {
        feedBackContext
            .deleteFeedback(selectedScript.key, feedbackId)
            .then(() => {
                loadMoreFeedbacks(true); // Reload feedbacks after deletion
            });
    };

    const handleTimestampClick = (timestamp) => {
        console.log("Timestamp clicked:", timestamp);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
            }}
        >
            <Title
                level={4}
                style={{
                    color: "#fff",
                    marginBottom: `${padding}px`,
                    height: titleHeight,
                }}
            >
                Feedback
            </Title>
            <div
                ref={scrollableDivRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: `${padding}px`,
                    minHeight: feedbacksHeight,
                    width: "100%",
                }}
                id="scrollableFeedBackDiv"
            >
                {loading ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <Spin tip="Loading feedbacks..." />
                    </div>
                ) : feedbacks.length > 0 ? (
                    <InfiniteScroll
                        dataLength={feedbacks.length}
                        next={() => loadMoreFeedbacks()}
                        hasMore={hasMore}
                        loader={
                            <Skeleton avatar paragraph={{ rows: 1 }} active />
                        }
                        endMessage={
                            <Divider plain style={{ color: "white" }}>
                                No more feedbacks 🤐
                            </Divider>
                        }
                        scrollableTarget="scrollableFeedBackDiv"
                    >
                        {feedbacks.map((feedback) => (
                            <FeedBackItem
                                key={feedback.id}
                                feedback={feedback}
                                currentUserId={currentUserId}
                                onReplyClick={handleReplyClick}
                                handleEditFeedback={handleEditFeedback}
                                handleDeleteFeedback={handleDeleteFeedback}
                                handleTimestampClick={handleTimestampClick}
                                handleReplySubmit={handleReplySubmit}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                expandedFeedbacks={expandedFeedbacks}
                                toggleExpandFeedback={toggleExpandFeedback}
                                highlighted={
                                    feedback.id ===
                                    parseInt(highlightedFeedbackId)
                                }
                                highlightedFeedbackId={highlightedFeedbackId}
                            />
                        ))}
                    </InfiniteScroll>
                ) : (
                    <Typography style={{ color: "#fff", fontSize: "16px" }}>
                        No feedbacks yet.
                    </Typography>
                )}
            </div>
            <Form
                form={form}
                onFinish={(values) => {
                    handleReplySubmit({
                        feedback: values.feedback,
                    });
                }}
                style={{ flexShrink: 0, height: formHeight, width: "100%" }}
            >
                <Form.Item
                    label={<span style={{ color: "white" }}>Feedback</span>}
                    name="feedback"
                    rules={[
                        { required: true, message: "Please enter a feedback" },
                    ]}
                    style={{ width: "100%", marginBottom: "8px" }}
                >
                    <TextArea
                        rows={3}
                        placeholder="Enter your feedback"
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "#e0e0e0",
                            borderRadius: 8,
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "8px",
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
    );
};

export default FeedBackDrawer;
