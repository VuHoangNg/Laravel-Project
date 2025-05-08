import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Typography,
    Spin,
    Alert,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Upload,
    Avatar,
    List,
} from "antd";
import { useMediaContext } from "../context/MediaContext";
import {
    UploadOutlined,
    CommentOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import ImageWithSkeleton from "../../../../../../Core/Resources/assets/js/components/page/SkeletonImage";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";
import { useSelector } from "react-redux";

const { Title, Text: AntText } = Typography;
const { TextArea } = Input;

// Function to build comment tree (reused from CommentSidebar)
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

// Reused CommentItem component
const CommentItem = ({
    comment,
    currentUserId,
    onReplyClick,
    handleEditComment,
    handleDeleteComment,
    handleTimestampClick,
}) => {
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

function MediaDetail({ api }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [commentForm] = Form.useForm();
    const [videoTime, setVideoTime] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const videoRef = useRef(null);

    const { getMediaContext, commentContext } = useMediaContext();
    const { fetchMediaById } = getMediaContext;
    const { fetchComments, createComment, updateComment, deleteComment } =
        commentContext;

    const comments = useSelector((state) => state.media.comments[id] || []);
    const commentTree = buildCommentTree(comments);
    const isMounted = useRef(false);

    // Fetch cookie utility
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return null;
    };

    useEffect(() => {
        isMounted.current = true;
        fetchMediaData();
        fetchCommentsForMedia();
        const userId = getCookie("id");
        if (userId) {
            setCurrentUserId(parseInt(userId));
        } else {
            setError("Please log in to access all features");
            navigate("/auth/login");
        }

        return () => {
            isMounted.current = false;
        };
    }, [id]);

    const fetchMediaData = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);

        try {
            const mediaData = await fetchMediaById(id);
            if (isMounted.current) {
                setMedia(mediaData);
                form.setFieldsValue({ title: mediaData.title });
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
    };

    const fetchCommentsForMedia = async () => {
        if (!isMounted.current) return;
        setCommentLoading(true);
        try {
            await fetchComments(id);
        } catch (err) {
            if (isMounted.current) {
                setError(
                    err.response?.data?.message || "Failed to load comments."
                );
            }
        } finally {
            if (isMounted.current) {
                setCommentLoading(false);
            }
        }
    };

    const handleSubmitEdit = async (values) => {
        if (!api) {
            setError("API client is not configured. Please contact support.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            if (values.file) {
                formData.append("file", values.file);
            }
            formData.append("_method", "PUT");
            const response = await api.post(`/api/media/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const mediaData = await fetchMediaById(id);
            setMedia(mediaData);
            form.setFieldsValue({
                title: mediaData.title,
            });
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([{ name: key, errors: errors[key] }]);
                });
            } else {
                setError(
                    error.response?.data?.message ||
                        error.message ||
                        "Failed to update media. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!api) {
            setError("API client is not configured. Please contact support.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/media/${id}`);
            setIsDeleteModalOpen(false);
            const page = searchParams.get("page") || "1";
            const perPage = searchParams.get("perPage") || "10";
            navigate(`/media?page=${page}&perPage=${perPage}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to delete media. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e.length > 0 ? e[0].originFileObj : null;
        }
        return (
            e &&
            e.fileList &&
            e.fileList.length > 0 &&
            e.fileList[0].originFileObj
        );
    };

    const handleBack = () => {
        const page = searchParams.get("page") || "1";
        const perPage = searchParams.get("perPage") || "12";
        navigate(`/media?page=${page}&perPage=${perPage}`);
    };

    const handleCommentSubmit = async (values) => {
        try {
            await createComment(
                id,
                values.comment,
                videoTime,
                replyTo ? replyTo.id : null
            );
            commentForm.resetFields();
            setReplyTo(null);
            await fetchCommentsForMedia();
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
    };

    const handleEditComment = (comment) => {
        // Placeholder: Implement edit modal or inline editing if needed
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteComment(commentId);
            await fetchCommentsForMedia();
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
    };

    const handleReplyClick = (comment) => {
        setReplyTo(comment);
        commentForm.setFieldsValue({
            comment: `@${comment.user.username} `,
        });
    };

    const handleTimestampClick = (timestamp) => {
        if (videoRef.current) {
            videoRef.current.seekTo(timestamp);
        }
    };

    const handleVideoPause = (currentTime) => {
        setVideoTime(currentTime);
    };

    return (
        <div
            style={{
                padding: "24px",
                backgroundColor: "#1C2526",
                minHeight: "100vh",
            }}
        >
            <Title level={2} style={{ color: "#fff" }}>
                Edit Media
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
                    {/* Media Preview */}
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
                                style={{ maxWidth: "100%", maxHeight: 300 }}
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
                                style={{ maxWidth: 400, maxHeight: 250 }}
                                onError={() =>
                                    console.log(
                                        "Image load error for:",
                                        media.thumbnail_url || media.url
                                    )
                                }
                            />
                        )}
                    </div>
                    {/* Edit Form */}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmitEdit}
                        style={{
                            background: "#fff",
                            padding: "16px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            marginBottom: 24,
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter a title",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="file"
                            label="Replace File"
                            getValueFromEvent={normFile}
                        >
                            <Upload
                                beforeUpload={() => false}
                                accept="image/*,video/*"
                                maxCount={1}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Upload File
                                </Button>
                            </Upload>
                        </Form.Item>
                        <Space style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                Save
                            </Button>
                            <Button danger onClick={handleOpenDelete}>
                                Delete
                            </Button>
                        </Space>
                    </Form>
                    {/* Comments Section */}
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
                                    />
                                ))}
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
                </>
            )}
            <Modal
                title="Confirm Delete"
                open={isDeleteModalOpen}
                onOk={handleConfirmDelete}
                onCancel={handleCancelDelete}
                okText="Delete"
                okType="danger"
            >
                <p>Are you sure you want to delete this media?</p>
            </Modal>
        </div>
    );
}

export default MediaDetail;
