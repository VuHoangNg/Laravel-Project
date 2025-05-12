import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Input, Avatar, Space } from "antd";
import { EditOutlined, DeleteOutlined, CommentOutlined } from "@ant-design/icons";

const { Text: AntText, Link: AntLink } = Typography;
const { TextArea } = Input;

// Utility function to parse comment text and create clickable usernames using antd
const parseCommentText = (text, handleUsernameClick) => {
  // Regular expression to match @username (alphanumeric with underscores)
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
        <AntText key={`text-${lastIndex}`} style={{ color: "white" }}>
          {text.slice(lastIndex, startIndex)}
        </AntText>
      );
    }

    // Add the username as a clickable AntLink
    parts.push(
      <AntLink
        key={`username-${startIndex}`}
        onClick={() => handleUsernameClick(username)}
        style={{ color: "#1890ff" }} // Blue color for usernames
        hoverable // Enables hover effect (underline)
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
  const isReplying = replyingTo?.id === comment.id;
  const hasReplies = comment.children?.length > 0;
  const isExpanded = expandedComments.has(comment.id);

  // Function to handle username clicks
  const handleUsernameClick = (username) => {
    // Find the user ID corresponding to the username
    const userId =
      comment.user.username === username
        ? comment.user.id
        : comment.children?.find((child) => child.user.username === username)
            ?.user.id;

    if (userId) {
      navigate(`/users/${userId}`);
    }
  };

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
    <Space
      direction="vertical"
      style={{
        width: "100%",
        marginBottom: 12,
        backgroundColor:
          highlightedCommentId === comment.id
            ? "rgba(24, 144, 255, 0.2)"
            : "transparent",
        transition: "background-color 1s",
        padding: 8, // Add padding to mimic div styling
      }}
    >
      <Space align="start">
        <Avatar
          src={comment.user.avatar_url}
          onClick={() => navigate(`/users/${comment.user.id}`)}
          style={{ cursor: "pointer" }}
        >
          {comment.user.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Space direction="vertical" style={{ width: "100%" }}>
          <AntText
            style={{
              fontSize: 12,
              opacity: 0.7,
              color: "white",
            }}
          >
            {comment.parent_id && (
              <AntText style={{ marginRight: 8, color: "white" }}>↳</AntText>
            )}
            <AntLink
              onClick={() => navigate(`/users/${comment.user.id}`)}
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
                onClick={() => handleTimestampClick(comment.timestamp)}
              >
                {comment.formatted_timestamp}
              </Button>
            ) : (
              "N/A"
            )}
          </AntText>
          <Space wrap>{parseCommentText(comment.text, handleUsernameClick)}</Space>
          <Space size="small">
            {isOwner && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditComment(comment)}
                  aria-label="Edit comment"
                />
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteComment(comment.id)}
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