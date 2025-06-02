import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Input, Avatar, Space } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    CommentOutlined,
} from "@ant-design/icons";

const { Text: AntText, Link: AntLink } = Typography;
const { TextArea } = Input;

// Utility function to parse comment text and create clickable usernames using antd
const parseCommentText = (text, handleUsernameClick) => {
    const usernameRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = usernameRegex.exec(text)) !== null) {
        const username = match[1];
        const startIndex = match.index;

        if (startIndex > lastIndex) {
            parts.push(
                <AntText key={`text-${lastIndex}`} style={{ color: "#000000" }}>
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
            <AntText key={`text-${lastIndex}`} style={{ color: "#000000" }}>
                {text.slice(lastIndex)}
            </AntText>
        );
    }

    return parts;
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
    expandedComments,
    toggleExpandComment,
}) => {
    const navigate = useNavigate();
    const isOwner =
        currentUserId && Number(currentUserId) === Number(comment.user.id);
    const [replyText, setReplyText] = useState(`@${comment.user.username} `);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const isReplying = replyingTo?.id === comment.id;
    const hasReplies = comment.children?.length > 0;
    const isExpanded = expandedComments.has(comment.id);
    const replyInputRef = useRef(null);
    const editInputRef = useRef(null);

    // Move cursor to the end when replying
    useEffect(() => {
        if (isReplying && replyInputRef.current) {
            const input = replyInputRef.current.resizableTextArea?.textArea;
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }, [isReplying]);

    // Focus edit TextArea when editing starts
    useEffect(() => {
        if (isEditing && editInputRef.current) {
            const input = editInputRef.current.resizableTextArea?.textArea;
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }, [isEditing]);

    const handleUsernameClick = (username) => {
        const userId =
            comment.user.username === username
                ? comment.user.id
                : comment.children?.find(
                      (child) => child.user.username === username
                  )?.user.id;

        if (userId) {
            navigate(`/users/${userId}`);
        }
    };

    const handleReplySubmitAction = () => {
        if (!replyText.trim()) return;
        const parentId = comment.parent_id ? comment.parent_id : comment.id;
        handleReplySubmit({
            comment: replyText,
            parent_id: parentId,
        });
        setReplyText(`@${comment.user.username} `);
        setReplyingTo(null);
    };

    const handleReplyCancel = () => {
        setReplyText(`@${comment.user.username} `);
        setReplyingTo(null);
    };

    const handleReplyKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleReplySubmitAction();
        }
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setEditText(comment.text);
    };

    const handleEditSave = () => {
        if (!editText.trim()) return;
        handleEditComment(comment.id, editText);
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditText(comment.text);
    };

    const handleEditKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEditSave();
        }
    };

    return (
        <Space
            direction="vertical"
            style={{
                width: "100%",
                marginBottom: 12,
                backgroundColor:
                    highlightedCommentId === comment.id
                        ? "rgba(24, 144, 255, 0.1)"
                        : "#FFFFFF",
                transition: "background-color 1s",
                padding: 8,
                overflowX: "hidden",
                overflowY: "hidden",
                borderRadius: 4,
            }}
        >
            <Space align="start">
                <Avatar
                    src={comment.user.avatar_url}
                    onClick={() => navigate(`/users/${comment.user.id}`)}
                    style={{
                        cursor: "pointer",
                    }}
                >
                    {comment.user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <AntText
                        style={{ fontSize: 12, opacity: 0.7, color: "#000000" }}
                    >
                        {comment.parent_id && (
                            <AntText style={{ marginRight: 8, color: "#000000" }}>
                                ↳
                            </AntText>
                        )}
                        <AntLink
                            onClick={() =>
                                navigate(`/users/${comment.user.id}`)
                            }
                            style={{ color: "#1890ff" }}
                            hoverable
                        >
                            {comment.user.username}
                        </AntLink>{" "}
                        at{" "}
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
                    {isEditing ? (
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <TextArea
                                ref={editInputRef}
                                rows={3}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    color: "#000000",
                                    borderRadius: 8,
                                    border: "1px solid #E0E0E0",
                                }}
                                autoFocus
                            />
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={handleEditSave}
                                    style={{ borderRadius: 8 }}
                                    disabled={!editText.trim()}
                                >
                                    Save
                                </Button>
                                <Button
                                    onClick={handleEditCancel}
                                    style={{ borderRadius: 8 }}
                                >
                                    Cancel
                                </Button>
                            </Space>
                        </Space>
                    ) : (
                        <Space wrap>
                            {parseCommentText(comment.text, handleUsernameClick)}
                        </Space>
                    )}
                    <Space size="small">
                        {isOwner && (
                            <>
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={handleEditStart}
                                    aria-label="Edit comment"
                                    style={{ color: "#1890ff" }}
                                />
                                <Button
                                    type="link"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                        handleDeleteComment(comment.id)
                                    }
                                    aria-label="Delete comment"
                                    style={{ color: "#1890ff" }}
                                />
                            </>
                        )}
                        <Button
                            type="link"
                            icon={<CommentOutlined />}
                            onClick={() => onReplyClick(comment)}
                            aria-label="Reply"
                            style={{ color: "#1890ff" }}
                        >
                            Reply
                        </Button>
                    </Space>
                    {isReplying && (
                        <Space
                            direction="vertical"
                            style={{
                                marginTop: 12,
                                marginLeft: comment.parent_id ? 40 : 0,
                                width: "100%",
                            }}
                        >
                            <TextArea
                                ref={replyInputRef}
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleReplyKeyDown}
                                placeholder={`Reply to ${comment.user.username}...`}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    color: "#000000",
                                    borderRadius: 8,
                                    border: "1px solid #E0E0E0",
                                }}
                                autoFocus
                            />
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={handleReplySubmitAction}
                                    style={{ borderRadius: 8 }}
                                    disabled={!replyText.trim()}
                                >
                                    Create
                                </Button>
                                <Button
                                    onClick={handleReplyCancel}
                                    style={{ borderRadius: 8 }}
                                >
                                    Cancel
                                </Button>
                            </Space>
                        </Space>
                    )}
                </Space>
            </Space>

            {!comment.parent_id && hasReplies && !isExpanded ? (
                <Space style={{ marginLeft: 48, marginTop: 8 }}>
                    <Button
                        type="link"
                        onClick={() => toggleExpandComment(comment.id)}
                        style={{ color: "#1890ff", padding: 0 }}
                    >
                        View more ({comment.children.length}{" "}
                        {comment.children.length === 1 ? "reply" : "replies"})
                    </Button>
                </Space>
            ) : (
                hasReplies && (
                    <Space
                        direction="vertical"
                        style={{ marginLeft: 40, marginTop: 12, width: "100%" }}
                    >
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
                                expandedComments={expandedComments}
                                toggleExpandComment={toggleExpandComment}
                            />
                        ))}
                    </Space>
                )
            )}
        </Space>
    );
};

export default CommentItem;