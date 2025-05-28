import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Input, Avatar, Space } from "antd";
import { EditOutlined, DeleteOutlined, CommentOutlined } from "@ant-design/icons";

const { Text: AntText, Link: AntLink } = Typography;
const { TextArea } = Input;

const parseFeedbackText = (text, handleUsernameClick) => {
    const usernameRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = usernameRegex.exec(text)) !== null) {
        const username = match[1];
        const startIndex = match.index;

        if (startIndex > lastIndex) {
            parts.push(
                <AntText key={`text-${lastIndex}`} style={{ color: "white" }}>
                    {text.slice(lastIndex, startIndex)}
                </AntText>
            );
        }

        parts.push(
            <AntLink
                key={`username-${startIndex}`}
                onClick={() => handleUsernameClick(username)}
                style={{ color: "#1890ff" }}
                hoverable
            >
                @{username}
            </AntLink>
        );

        lastIndex = usernameRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(
            <AntText key={`text-${lastIndex}`} style={{ color: "white" }}>
                {text.slice(lastIndex)}
            </AntText>
        );
    }

    return parts;
};

const FeedBackItem = ({
    feedback,
    currentUserId,
    onReplyClick,
    handleEditFeedback,
    handleDeleteFeedback,
    handleReplySubmit,
    replyingTo,
    setReplyingTo,
    highlightedFeedbackId,
    expandedFeedbacks,
    toggleExpandFeedback,
    highlighted,
}) => {
    const navigate = useNavigate();
    const isOwner =
        currentUserId && Number(currentUserId) === Number(feedback.user.id);
    const [replyText, setReplyText] = useState(`@${feedback.user.username} `);
    const isReplying = replyingTo?.id === feedback.id;
    const hasReplies = feedback.children?.length > 0;
    const isExpanded = expandedFeedbacks.has(feedback.id);
    const replyInputRef = useRef(null);

    useEffect(() => {
        if (isReplying && replyInputRef.current) {
            const input = replyInputRef.current.resizableTextArea?.textArea;
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }, [isReplying]);

    const handleUsernameClick = (username) => {
        const userId =
            feedback.user.username === username
                ? feedback.user.id
                : feedback.children?.find(
                      (child) => child.user.username === username
                  )?.user.id;

        if (userId) {
            navigate(`/users/${userId}`);
        }
    };

    const handleSubmit = () => {
        if (!replyText.trim()) {
            return;
        }
        const parentId = feedback.parent_id ? feedback.parent_id : feedback.id;
        handleReplySubmit({
            feedback: replyText,
            parent_id: parentId,
        });
        setReplyText(`@${feedback.user.username} `);
        setReplyingTo(null);
    };

    const handleCancel = () => {
        setReplyText(`@${feedback.user.username} `);
        setReplyingTo(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Space
            direction="vertical"
            style={{
                width: "100%",
                marginBottom: 12,
                backgroundColor: highlighted
                    ? "rgba(24, 144, 255, 0.2)"
                    : "transparent",
                transition: "background-color 1s",
                padding: 8,
                overflowX: "hidden",
                overflowY: "hidden",
            }}
        >
            <Space align="start">
                <Avatar
                    src={feedback.user.avatar_url}
                    onClick={() => navigate(`/users/${feedback.user.id}`)}
                    style={{ cursor: "pointer" }}
                >
                    {feedback.user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <AntText style={{ fontSize: 12, opacity: 0.7, color: "white" }}>
                        {feedback.parent_id && (
                            <AntText style={{ marginRight: 8, color: "white" }}>
                                ↳
                            </AntText>
                        )}
                        <AntLink
                            onClick={() => navigate(`/users/${feedback.user.id}`)}
                            style={{ color: "#1890ff" }}
                            hoverable
                        >
                            {feedback.user.username}
                        </AntLink>{" "}
                        at{" "}
                        {feedback.formatted_timestamp ? (
                            <Button
                                type="link"
                                style={{ padding: 0, color: "#1890ff" }}
                                onClick={() => console.log("Timestamp clicked:", feedback.timestamp)}
                            >
                                {feedback.formatted_timestamp}
                            </Button>
                        ) : (
                            "N/A"
                        )}
                    </AntText>
                    <Space wrap>
                        {parseFeedbackText(feedback.text, handleUsernameClick)}
                    </Space>
                    <Space size="small">
                        {isOwner && (
                            <>
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditFeedback(feedback)}
                                    aria-label="Edit feedback"
                                />
                                <Button
                                    type="link"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteFeedback(feedback.id)}
                                    aria-label="Delete feedback"
                                />
                            </>
                        )}
                        <Button
                            type="link"
                            icon={<CommentOutlined />}
                            onClick={() => onReplyClick(feedback)}
                            aria-label="Reply"
                        >
                            Reply
                        </Button>
                    </Space>
                    {isReplying && (
                        <Space
                            direction="vertical"
                            style={{
                                marginTop: 12,
                                marginLeft: feedback.parent_id ? 40 : 0,
                                width: "100%",
                            }}
                        >
                            <TextArea
                                ref={replyInputRef}
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Reply to ${feedback.user.username}...`}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    color: "#e0e0e0",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                autoFocus
                            />
                            <Space>
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
                        </Space>
                    )}
                </Space>
            </Space>

            {!feedback.parent_id && hasReplies && !isExpanded ? (
                <Space style={{ marginLeft: 48, marginTop: 8 }}>
                    <Button
                        type="link"
                        onClick={() => toggleExpandFeedback(feedback.id)}
                        style={{ color: "#1890ff", padding: 0 }}
                    >
                        View more ({feedback.children.length}{" "}
                        {feedback.children.length === 1 ? "reply" : "replies"})
                    </Button>
                </Space>
            ) : (
                hasReplies && (
                    <Space
                        direction="vertical"
                        style={{ marginLeft: 40, marginTop: 12, width: "100%" }}
                    >
                        {feedback.children.map((child) => (
                            <FeedBackItem
                                key={child.id}
                                feedback={child}
                                currentUserId={currentUserId}
                                onReplyClick={onReplyClick}
                                handleEditFeedback={handleEditFeedback}
                                handleDeleteFeedback={handleDeleteFeedback}
                                handleReplySubmit={handleReplySubmit}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                highlightedFeedbackId={highlightedFeedbackId}
                                expandedFeedbacks={expandedFeedbacks}
                                toggleExpandFeedback={toggleExpandFeedback}
                                highlighted={
                                    child.id === parseInt(highlightedFeedbackId)
                                }
                            />
                        ))}
                    </Space>
                )
            )}
        </Space>
    );
};

export default FeedBackItem;