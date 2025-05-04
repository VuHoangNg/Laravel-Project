import React, { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Typography, List, Button, Form, Input, Avatar } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text: AntText } = Typography;
const { TextArea } = Input;

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
                        position: "relative",
                        zIndex: 100,
                        overflow: "hidden",
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
                        overflowX: "hidden",
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
                                <List
                                    dataSource={
                                        comments[selectedMedia.id] || []
                                    }
                                    renderItem={(item) => {
                                        const isOwner =
                                            currentUserId &&
                                            item.user.id &&
                                            Number(currentUserId) ===
                                                Number(item.user.id);
                                        console.log(
                                            "Debug - currentUserId:",
                                            currentUserId,
                                            "item.user:",
                                            item.user,
                                            "isOwner:",
                                            isOwner
                                        );
                                        return (
                                            <List.Item
                                                style={{
                                                    borderBottom:
                                                        "1px solid rgba(255, 255, 255, 0.1)",
                                                    padding: "8px 0",
                                                    alignItems: "flex-start",
                                                }}
                                                actions={
                                                    isOwner
                                                        ? [
                                                              <Button
                                                                  key="edit"
                                                                  type="link"
                                                                  icon={
                                                                      <EditOutlined />
                                                                  }
                                                                  onClick={() =>
                                                                      handleEditComment(
                                                                          item
                                                                      )
                                                                  }
                                                                  aria-label="Edit comment"
                                                              />,
                                                              <Button
                                                                  key="delete"
                                                                  type="link"
                                                                  icon={
                                                                      <DeleteOutlined />
                                                                  }
                                                                  onClick={() =>
                                                                      handleDeleteComment(
                                                                          item.id
                                                                      )
                                                                  }
                                                                  aria-label="Delete comment"
                                                              />,
                                                          ]
                                                        : []
                                                }
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems:
                                                            "flex-start",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <Avatar
                                                        src={
                                                            item.user.avatar_url
                                                        }
                                                        style={{
                                                            marginRight: "8px",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {item.user.username
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </Avatar>

                                                    <div
                                                        style={{
                                                            color: "#fff",
                                                            flex: 1,
                                                            wordBreak:
                                                                "break-word",
                                                        }}
                                                    >
                                                        <AntText
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                opacity: 0.7,
                                                                display:
                                                                    "block",
                                                                color: "white",
                                                            }}
                                                        >
                                                            {item.user.username}{" "}
                                                            at{" "}
                                                            {item.formatted_timestamp ? (
                                                                <Button
                                                                    type="link"
                                                                    style={{
                                                                        padding: 0,
                                                                        color: "#1890ff",
                                                                    }}
                                                                    onClick={() =>
                                                                        handleTimestampClick(
                                                                            item.timestamp
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        item.formatted_timestamp
                                                                    }
                                                                </Button>
                                                            ) : (
                                                                "N/A"
                                                            )}
                                                        </AntText>
                                                        <AntText
                                                            style={{
                                                                color: "white",
                                                            }}
                                                        >
                                                            {item.text}
                                                        </AntText>
                                                    </div>
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            </div>
                            <Form
                                form={commentForm}
                                onFinish={handleCommentSubmit}
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
                                        placeholder="Add a comment..."
                                        style={{
                                            backgroundColor:
                                                "rgba(255, 255, 255, 0.05)",
                                            color: "white",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ width: "100%" }}
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
