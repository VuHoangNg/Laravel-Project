import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Typography,
    Spin,
    Alert,
    Row,
    Col,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Card,
    Pagination,
    Tag,
} from "antd";

import { useBlogContext } from "../context/BlogContext";
import { useSelector, useDispatch } from "react-redux";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";

const { Title } = Typography;
const { Meta } = Card;

function BlogDetail({ api }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [mediaPagination, setMediaPagination] = useState({
        currentPage: 1,
        limit: 6,
        total: 0,
    });
    const [form] = Form.useForm();
    const loggedErrors = new Set();

    const media = useSelector(
        (state) =>
            state.blogs.media || {
                data: [],
                current_page: 1,
                per_page: 6,
                total: 0,
                last_page: 1,
            }
    );

    const { createBlogContext, editingBlogContext, deleteBlogContext } =
        useBlogContext();
    const { resetForm } = createBlogContext;
    const { updateBlog } = editingBlogContext;
    const { deleteBlog } = deleteBlogContext;

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchBlog();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchBlog = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/blogs/${id}`, {
                params: { fields: "id,title,content,media" },
            });

            if (isMounted.current) {
                setBlog(response.data);
                form.setFieldsValue({
                    title: response.data.title,
                    content: response.data.content,
                });
                setSelectedMediaIds(
                    response.data.media && Array.isArray(response.data.media)
                        ? response.data.media.map((m) => m.id)
                        : []
                );
            }
        } catch (err) {
            if (isMounted.current) {
                setError("Failed to load blog details. Please try again.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!isMediaModalOpen) return;
        isMounted.current = true;
        fetchMediaForModal();

        return () => {
            isMounted.current = false;
        };
    }, [
        mediaPagination.currentPage,
        mediaPagination.limit,
        isMediaModalOpen,
    ]);

    const fetchMediaForModal = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                `/api/media?perPage=${mediaPagination.limit}&page=${mediaPagination.currentPage}&fields=id,title,url,thumbnail_url,type`
            );

            if (isMounted.current) {
                dispatch(setMedia(response.data));
                setMediaPagination((prev) => ({
                    ...prev,
                    total: response.data.total,
                }));
            }
        } catch (error) {
            if (isMounted.current) {
                setError("Failed to fetch media. Please try again.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleImageError = (e, item) => {
        const errorKey = `${item?.title || "unknown"}:${
            item?.url || "unknown"
        }`;
        if (!loggedErrors.has(errorKey)) {
            loggedErrors.add(errorKey);
        }
        e.target.src = "/images/placeholder.png";
    };

    const handleSubmitEdit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...values,
                media_ids: selectedMediaIds,
            };
            await updateBlog(id, payload);
            const response = await api.get(`/api/blogs/${id}`, {
                params: { fields: "id,title,content,media" },
            });
            setBlog(response.data);
            form.setFieldsValue({
                title: response.data.title,
                content: response.data.content,
            });
            setSelectedMediaIds(
                response.data.media && Array.isArray(response.data.media)
                    ? response.data.media.map((m) => m.id)
                    : []
            );
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([
                        {
                            name: key,
                            errors: errors[key],
                        },
                    ]);
                });
            } else {
                setError("Failed to update blog. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await deleteBlog(id);
            setIsDeleteModalOpen(false);
            navigate("/blog");
        } catch (err) {
            setError("Failed to delete blog. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
    };

    const handleOpenMediaModal = () => {
        setIsMediaModalOpen(true);
        setMediaPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleCloseMediaModal = () => {
        setIsMediaModalOpen(false);
    };

    const handleSelectMedia = (mediaId) => {
        setSelectedMediaIds((prev) =>
            prev.includes(mediaId)
                ? prev.filter((id) => id !== mediaId)
                : [...prev, mediaId]
        );
    };

    const handleMediaPageChange = async (page, pageSize) => {
        setLoading(true);
        setError(null);
        try {
            setMediaPagination((prev) => ({
                ...prev,
                currentPage: page,
                limit: pageSize,
            }));
        } catch (err) {
            setError("Failed to load media. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const page = searchParams.get("page") || "1";
        navigate(`/blog?page=${page}`);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Edit Blog</Title>
            <Button onClick={handleBack} style={{ marginBottom: 16 }}>
                Back to Blog List
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
            {blog && (
                <div>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmitEdit}
                        style={{
                            background: "#fff",
                            padding: "16px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
                            name="content"
                            label="Content"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter content",
                                },
                            ]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item label="Media">
                            <Button
                                type="dashed"
                                onClick={handleOpenMediaModal}
                            >
                                Select Media ({selectedMediaIds.length}{" "}
                                selected)
                            </Button>
                        </Form.Item>
                        <Space style={{ marginBottom: 16 }}>
                            <Button type="primary" htmlType="submit">
                                Save
                            </Button>
                            <Button danger onClick={handleOpenDelete}>
                                Delete
                            </Button>
                        </Space>
                    </Form>
                    {blog.media &&
                        Array.isArray(blog.media) &&
                        blog.media.length > 0 && (
                            <>
                                <Title level={4}>Media</Title>
                                <Row gutter={[16, 16]}>
                                    {blog.media.map((item) => (
                                        <Col span={8} key={item.id}>
                                            {item.type === 'video' ? (
                                                <VideoPlayer
                                                    src={item.url}
                                                    style={{
                                                        height: 200,
                                                        objectFit: "cover",
                                                        width: "100%",
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    alt={item.title}
                                                    src={
                                                        item.thumbnail_url ||
                                                        item.url ||
                                                        "/images/placeholder.png"
                                                    }
                                                    style={{
                                                        height: 200,
                                                        objectFit: "cover",
                                                        width: "100%",
                                                    }}
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            item
                                                        )
                                                    }
                                                />
                                            )}
                                            <p>{item.title}</p>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}
                </div>
            )}
            <Modal
                title="Confirm Delete"
                open={isDeleteModalOpen}
                onOk={handleConfirmDelete}
                onCancel={handleCancelDelete}
                okText="Delete"
                okType="danger"
            >
                <p>Are you sure you want to delete this blog?</p>
            </Modal>
            <Modal
                title="Select Media"
                open={isMediaModalOpen}
                onCancel={handleCloseMediaModal}
                footer={null}
                width="90%"
                style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
                {loading ? (
                    <div style={{ textAlign: "center", margin: "20px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        style={{ marginBottom: 16 }}
                    />
                ) : !media.data || media.data.length === 0 ? (
                    <Alert
                        message="No Media Available"
                        description="Please upload some media to select."
                        type="info"
                        showIcon
                    />
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            {media.data.map((item) => {
                                const isVideoMedia = item.type === 'video';
                                const isSelected = selectedMediaIds.includes(
                                    item.id
                                );

                                return (
                                    <Col span={8} key={item.id}>
                                        <Card
                                            hoverable
                                            style={{
                                                border: isSelected
                                                    ? "2px solid #1890ff"
                                                    : "1px solid #d9d9d9",
                                            }}
                                            cover={
                                                isVideoMedia ? (
                                                    <VideoPlayer
                                                        src={item.url}
                                                        style={{
                                                            height: 250,
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        alt={item.title}
                                                        src={
                                                            item.thumbnail_url ||
                                                            item.url ||
                                                            "/images/placeholder.png"
                                                        }
                                                        style={{
                                                            height: 250,
                                                            objectFit: "cover",
                                                        }}
                                                        onError={(e) =>
                                                            handleImageError(
                                                                e,
                                                                item
                                                            )
                                                        }
                                                    />
                                                )
                                            }
                                            onClick={() =>
                                                handleSelectMedia(item.id)
                                            }
                                        >
                                            <Meta
                                                title={item.title}
                                                description={
                                                    isVideoMedia
                                                        ? "Video"
                                                        : "Image"
                                                }
                                            />
                                            {isSelected && (
                                                <Tag
                                                    color="blue"
                                                    style={{
                                                        position: "absolute",
                                                        top: 10,
                                                        left: 10,
                                                    }}
                                                >
                                                    Selected
                                                </Tag>
                                            )}
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                        <Pagination
                            style={{ marginTop: 16, textAlign: "center" }}
                            current={mediaPagination.currentPage}
                            pageSize={mediaPagination.limit}
                            total={mediaPagination.total}
                            onChange={handleMediaPageChange}
                            showSizeChanger={true}
                            pageSizeOptions={["6", "12", "24"]}
                        />
                    </>
                )}
            </Modal>
        </div>
    );
}

export default BlogDetail;