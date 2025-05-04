import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Typography, List, Button, Form, Input, Avatar, Space } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    CommentOutlined,
} from "@ant-design/icons";

const { Title, Text: AntText } = Typography;
const { TextArea } = Input;

const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    comments.forEach((comment) => {
        map[comment.id] = { ...comment, children: [] };
    });

    comments.forEach((comment) => {
        if (comment.parent_id) {
            const parent = map[comment.parent_id];
            if (parent) {
                parent.children.push(map[comment.id]);
            }
        } else {
            roots.push(map[comment.id]);
        }
    });

    return roots;
};

const CommentItem = ({
    comment,
    currentUserId,
    onReplyClick,
    onSubmitReply,
    activeReplyId,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (activeReplyId === comment.id) {
            form.setFieldsValue({ comment: `@${comment.user.username} ` });
        }
    }, [activeReplyId, form, comment.user.username]);

    const isOwner =
        currentUserId && Number(currentUserId) === Number(comment.user.id);

    return (
        <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
                <Avatar
                    src={comment.user.avatar_url}
                    style={{ marginRight: 8 }}
                >
                    {comment.user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ color: "#fff", flex: 1 }}>
                    <AntText
                        style={{ fontSize: 12, opacity: 0.7, display: "block" , color:"white"}}
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

                    {activeReplyId === comment.id && (
                        <Form
                            form={form}
                            onFinish={(values) =>
                                onSubmitReply(values.comment, comment.id, form)
                            }
                            style={{ marginTop: 8 }}
                        >
                            <Form.Item
                                name="comment"
                                rules={[
                                    { required: true, message: "Enter reply" },
                                ]}
                            >
                                <TextArea
                                    rows={2}
                                    placeholder={`Reply to ${comment.user.username}...`}
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.05)",
                                        color: "white",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: 8,
                                    }}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Reply
                                </Button>
                            </Form.Item>
                        </Form>
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
                            onSubmitReply={onSubmitReply}
                            activeReplyId={activeReplyId}
                            handleEditComment={handleEditComment}
                            handleDeleteComment={handleDeleteComment}
                            handleTimestampClick={handleTimestampClick}
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
    updateContentWidth,
    debouncedUpdateContentWidth,
    currentUserId,
}) => {
    const comments = useSelector((state) => state.media.comments);
    const commentSplitterRef = useRef(null);
    const [replyTo, setReplyTo] = useState(null);
    const [activeReplyId, setActiveReplyId] = useState(null);

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
        console.log("replyTo changed:", replyTo);
        if (replyTo) {
            console.log(
                "Pre-filling form for reply to:",
                replyTo.user.username
            );
            commentForm.setFieldsValue({
                comment: `@${replyTo.user.username} `,
            });
        } else {
            commentForm.resetFields();
        }
    }, [replyTo, commentForm]);

    const commentList = comments[selectedMedia?.id] || [];
    const commentTree = buildCommentTree(commentList);

    const handleReplyClick = (comment) => {
        console.log("Reply clicked for comment:", comment);
        setReplyTo(comment);
        setActiveReplyId(null); // Hide inline reply form
    };

    const handleSubmit = (values) => {
        console.log(
            "Submitting comment with values:",
            values,
            "replyTo:",
            replyTo
        );
        const payload = {
            comment: values.comment,
            ...(replyTo && { parent_id: replyTo.id }),
        };
        console.log("Final payload to handleCommentSubmit:", payload);
        handleCommentSubmit(payload);
        setReplyTo(null);
        commentForm.resetFields();
    };

    const handleInlineReplySubmit = (replyText, parentId, formInstance) => {
        console.log("Submitting inline reply:", { replyText, parentId });
        const payload = {
            comment: replyText,
            parent_id: parentId,
        };
        console.log("Final inline reply payload:", payload);
        handleCommentSubmit(payload);
        setActiveReplyId(null);
        formInstance.resetFields();
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
                            >
                                {commentTree.map((comment) => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        currentUserId={currentUserId}
                                        onReplyClick={handleReplyClick}
                                        onSubmitReply={handleInlineReplySubmit}
                                        activeReplyId={activeReplyId}
                                        handleEditComment={handleEditComment}
                                        handleDeleteComment={
                                            handleDeleteComment
                                        }
                                        handleTimestampClick={
                                            handleTimestampClick
                                        }
                                    />
                                ))}
                            </div>
                            <Form
                                form={commentForm}
                                onFinish={handleSubmit}
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
                                        placeholder={
                                            replyTo
                                                ? `Reply to ${replyTo.user.username}...`
                                                : `Comment at ${Math.floor(
                                                      videoTime / 60
                                                  )
                                                      .toString()
                                                      .padStart(
                                                          2,
                                                          "0"
                                                      )}:${Math.floor(
                                                      videoTime % 60
                                                  )
                                                      .toString()
                                                      .padStart(2, "0")}`
                                        }
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
