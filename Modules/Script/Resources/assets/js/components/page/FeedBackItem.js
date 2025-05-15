import React, { useState } from "react";
import { Avatar, Typography, Button, Space, Form, Input, Modal } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    CommentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text: AntText, Link: AntLink } = Typography;
const { TextArea } = Input;

const FeedBackItem = ({
    feedback,
    currentUserId,
    onReplyClick,
    handleEditFeedback,
    handleDeleteFeedback,
    handleTimestampClick,
    handleReplySubmit,
    replyingTo,
    setReplyingTo,
    expandedFeedbacks,
    toggleExpandFeedback,
    highlighted,
    highlightedFeedbackId,
}) => {
    const [form] = Form.useForm();
    const [replyText, setReplyText] = useState(
        `@${feedback.user?.username || "Anonymous"} `
    );
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(feedback.text);
    const isReplying = replyingTo?.id === feedback.id;
    const navigate = useNavigate();
    const hasChildren = feedback.children && feedback.children.length > 0;
    const isExpanded = expandedFeedbacks.has(feedback.id);

    const handleUsernameClick = (username) => {
        navigate(`/users/${feedback.user?.id}`);
    };

    const parseCommentText = (text, handleUsernameClick) => {
        const usernameRegex = /@([a-zA-Z0-9_]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        // Iterate through all matches of @username
        while ((match = usernameRegex.exec(text)) !== null) {
            const username = match[1];
            const startIndex = match.index;

            // Add text before the username
            if (startIndex > lastIndex) {
                parts.push(
                    <AntText
                        key={`text-${lastIndex}`}
                        style={{ color: "white" }}
                    >
                        {text.slice(lastIndex, startIndex)}
                    </AntText>
                );
            }

            // Add the username as a clickable AntLink
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

        // Add remaining text after the last username
        if (lastIndex < text.length) {
            parts.push(
                <AntText key={`text-${lastIndex}`} style={{ color: "white" }}>
                    {text.slice(lastIndex)}
                </AntText>
            );
        }

        return parts;
    };

    const handleReplySubmitLocal = (values) => {
        if (!values.reply.trim()) return;
        const parentId = feedback.parent_id ? feedback.parent_id : feedback.id;
        handleReplySubmit({
            feedback: values.reply,
            parent_id: parentId,
        });
        setReplyingTo(null);
        setReplyText(`@${feedback.user?.username || "Anonymous"} `);
        form.resetFields();
    };

    const handleCancel = () => {
        setReplyingTo(null);
        setReplyText(`@${feedback.user?.username || "Anonymous"} `);
        form.resetFields();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.submit();
        }
    };

    // Edit Modal Handlers
    const showEditModal = () => {
        setEditText(feedback.text);
        setIsEditing(true);
    };

    const handleEditSubmit = () => {
        handleEditFeedback({ ...feedback, text: editText }); // Pass updated feedback to parent
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
    };

    const handleEditTextChange = (e) => {
        setEditText(e.target.value);
    };

    return (
        <div
            id={`feedback-${feedback.id}`}
            style={{
                marginBottom: 16,
                paddingLeft: feedback.parent_id ? 24 : 0,
                borderLeft: feedback.parent_id
                    ? "2px solid rgba(255, 255, 255, 0.1)"
                    : "none",
                backgroundColor: highlighted
                    ? "rgba(64, 169, 255, 0.1)"
                    : "transparent",
                padding: highlighted ? "8px" : "0",
                borderRadius: highlighted ? "4px" : "0",
            }}
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <Space align="start">
                    <Avatar
                        src={feedback.user?.avatar_url}
                        style={{
                            backgroundColor: "#1890ff",
                            cursor: "pointer",
                        }}
                        onClick={() => navigate(`/users/${feedback.user?.id}`)}
                    >
                        {feedback.user?.name?.charAt(0) || "U"}
                    </Avatar>
                    <Space direction="vertical" size={4}>
                        <Space>
                            <AntLink
                                onClick={() =>
                                    navigate(`/users/${feedback.user?.id}`)
                                }
                                style={{ color: "#1890ff" }}
                                hoverable
                            >
                                {feedback.user?.username}
                            </AntLink>
                        </Space>
                        <div style={{ color: "#e0e0e0" }}>
                            {parseCommentText(
                                feedback.text,
                                handleUsernameClick
                            )}
                        </div>
                        <Space size="small">
                            <Button
                                type="link"
                                icon={<CommentOutlined />}
                                onClick={() => {
                                    onReplyClick(feedback);
                                    setReplyText(
                                        `@${
                                            feedback.user?.username ||
                                            "Anonymous"
                                        } `
                                    );
                                }}
                                style={{ color: "#40a9ff" }}
                                aria-label="Reply"
                            >
                                Reply
                            </Button>
                            {feedback.user?.id === currentUserId && (
                                <>
                                    <Button
                                        type="link"
                                        icon={<EditOutlined />}
                                        onClick={showEditModal}
                                        style={{ color: "#40a9ff" }}
                                        aria-label="Edit feedback"
                                    />
                                    <Button
                                        type="link"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                            handleDeleteFeedback(feedback.id)
                                        }
                                        style={{ color: "#ff4d4f" }}
                                        aria-label="Delete feedback"
                                    />
                                </>
                            )}
                            {hasChildren && (
                                <Button
                                    type="link"
                                    onClick={() =>
                                        toggleExpandFeedback(feedback.id)
                                    }
                                    style={{ color: "#40a9ff" }}
                                    aria-expanded={isExpanded}
                                    aria-label={
                                        isExpanded
                                            ? "Collapse replies"
                                            : "View more replies"
                                    }
                                >
                                    {isExpanded
                                        ? "Collapse"
                                        : `Show ${feedback.children.length} replies`}
                                </Button>
                            )}
                        </Space>
                    </Space>
                </Space>
                {isReplying && (
                    <Form
                        form={form}
                        onFinish={handleReplySubmitLocal}
                        style={{ marginTop: 8, marginLeft: 40 }}
                    >
                        <Form.Item
                            name="reply"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter a reply",
                                },
                            ]}
                            initialValue={replyText}
                        >
                            <TextArea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Reply to ${
                                    feedback.user?.username || "Anonymous"
                                }...`}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    color: "#e0e0e0",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                autoFocus
                            />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    disabled={!replyText.trim()}
                                    style={{ borderRadius: 8 }}
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
                        </Form.Item>
                    </Form>
                )}
                {hasChildren && isExpanded && (
                    <div style={{ marginTop: 8, marginLeft: 40 }}>
                        {feedback.children.map((child) => (
                            <FeedBackItem
                                key={child.id}
                                feedback={child}
                                currentUserId={currentUserId}
                                onReplyClick={onReplyClick}
                                handleEditFeedback={handleEditFeedback}
                                handleDeleteFeedback={handleDeleteFeedback}
                                handleTimestampClick={handleTimestampClick}
                                handleReplySubmit={handleReplySubmit}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                expandedFeedbacks={expandedFeedbacks}
                                toggleExpandFeedback={toggleExpandFeedback}
                                highlighted={
                                    child.id === parseInt(highlightedFeedbackId)
                                }
                                highlightedFeedbackId={highlightedFeedbackId}
                            />
                        ))}
                    </div>
                )}
            </Space>

            {/* Edit Modal */}
            <Modal
                title="Edit Feedback"
                open={isEditing}
                onOk={handleEditSubmit}
                onCancel={handleEditCancel}
                okText="Save"
                cancelText="Cancel"
            >
                <Form layout="vertical">
                    <Form.Item label="Feedback">
                        <TextArea
                            value={editText}
                            onChange={handleEditTextChange}
                            rows={3}
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                color: "black",
                                borderRadius: 8,
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FeedBackItem;
