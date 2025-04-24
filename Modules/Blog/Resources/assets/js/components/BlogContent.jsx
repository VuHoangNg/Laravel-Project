import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Card,
    Row,
    Col,
    Pagination,
    Spin,
    Alert,
    Tag,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { useBlogContext } from "../context/BlogContext";
import VideoPlayer from "../../../../../Core/Resources/assets/js/components/videoPlayer";

const { Title, Paragraph } = Typography;
const { Meta } = Card;

function BlogContent({ api }) {
    const dispatch = useDispatch();
    const blogs = useSelector((state) => {
        return (
            state.blogs.blogs || {
                data: [],
                current_page: 1,
                per_page: 10,
                total: 0,
                last_page: 1,
            }
        );
    });
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
    const {
        createBlogContext,
        editingBlogContext,
        getBlogContext,
        deleteBlogContext,
    } = useBlogContext();
    const { resetForm, createBlog } = createBlogContext;
    const { editingBlog, updateBlog } = editingBlogContext;
    const { isModalOpen, openModal, closeModal, fetchBlogs } = getBlogContext;
    const {
        isDeleteModalOpen,
        blogToDelete,
        openDeleteModal,
        closeDeleteModal,
        deleteBlog,
    } = deleteBlogContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [mediaPagination, setMediaPagination] = useState({
        currentPage: 1,
        limit: 6,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // State for blog detail modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchBlogs(1, 10);
            } catch (err) {
                setError("Failed to load blogs. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const fetchMediaForModal = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(
                    `/api/media?perPage=${mediaPagination.limit}&page=${mediaPagination.currentPage}`
                );
                dispatch({
                    type: "media/setMedia",
                    payload: response.data,
                });
                setMediaPagination((prev) => ({
                    ...prev,
                    total: response.data.total,
                }));
            } catch (error) {
                setError("Failed to fetch media. Please try again.");
                console.error("Failed to fetch media:", error);
            } finally {
                setLoading(false);
            }
        };
        if (isMediaModalOpen) {
            fetchMediaForModal();
        }
    }, [api, dispatch, mediaPagination.currentPage, isMediaModalOpen]);

    const handleTableChange = (pagination) => {
        setLoading(true);
        fetchBlogs(pagination.current, pagination.pageSize).finally(() => {
            setLoading(false);
        });
    };

    const handleRowClick = async (blog) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch full blog details from the API
            const response = await api.get(`/api/blogs/${blog.id}`);
            setSelectedBlog(response.data);
            setIsDetailModalOpen(true);
            setSearchParams({ action: "view", id: blog.id });
        } catch (err) {
            setError("Failed to load blog details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedBlog(null);
        setSearchParams({});
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...values,
                media_ids: selectedMediaIds,
            };
            let response;
            if (editingBlog) {
                response = await updateBlog(editingBlog.id, payload);
                dispatch({
                    type: "blogs/updateBlog",
                    payload: response.data,
                });
            } else {
                response = await createBlog(payload);
                dispatch({
                    type: "blogs/addBlog",
                    payload: response.data,
                });
            }
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
            setSelectedMediaIds([]);
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
            }
        } finally {
            setLoading(false);
            closeModal();
        }
    };

    const handleDelete = (id) => {
        setSearchParams({ action: "delete", id });
        openDeleteModal(id);
    };

    const handleConfirmDelete = () => {
        deleteBlog(blogToDelete);
        closeDeleteModal();
        setSearchParams({});
    };

    const handleCancelDelete = () => {
        closeDeleteModal();
        setSearchParams({});
    };

    const handleOpenCreate = () => {
        openModal();
        form.setFieldsValue({ title: "", content: "" });
        resetForm();
        setSelectedMediaIds([]);
        setSearchParams({ action: "create" });
    };

    const handleOpenEdit = (blog) => {
        openModal(blog);
        form.setFieldsValue({
            title: blog.title,
            content: blog.content,
        });
        setSelectedMediaIds(blog.media.map((m) => m.id));
        setSearchParams({ action: "edit", id: blog.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
        setSelectedMediaIds([]);
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

    const handleImageError = (e, item) => {
        console.error(
            `Failed to load image for ${item?.title || "unknown"}:`,
            item?.url,
            item?.thumbnail
        );
        e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
    };

    const handleMediaPageChange = (page) => {
        setMediaPagination((prev) => ({ ...prev, currentPage: page }));
    };

    const isVideo = (url) => {
        return (
            typeof url === "string" &&
            url.includes("/storage/media/videos/") &&
            url.endsWith(".m3u8")
        );
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Content",
            dataIndex: "content",
            key: "content",
            render: (text) => (text ? text.substring(0, 50) + "..." : ""),
        },
        {
            title: "Media",
            dataIndex: "media",
            key: "media",
            render: (media) =>
                media.length > 0 ? (
                    <Space wrap>
                        {media.map((item) => (
                            <Tag key={item.id} color="blue">
                                {item.title}
                            </Tag>
                        ))}
                    </Space>
                ) : (
                    "No Media"
                ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleOpenEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button danger onClick={() => handleDelete(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Blog Management</Title>

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
            {!loading && (
                <>
                    <Button
                        type="primary"
                        onClick={handleOpenCreate}
                        style={{ marginBottom: 16 }}
                    >
                        Add Blog
                    </Button>
                    <Table
                        columns={columns}
                        dataSource={blogs.data || []}
                        rowKey="id"
                        scroll={{ x: "max-content" }}
                        pagination={{
                            current: blogs.current_page,
                            pageSize: blogs.per_page,
                            total: blogs.total,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                        }}
                        onChange={handleTableChange}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: "pointer" },
                        })}
                        locale={{
                            emptyText:
                                "No blogs available. Create a new blog to get started!",
                        }}
                    />
                </>
            )}
            <Modal
                title={editingBlog ? "Edit Blog" : "Add Blog"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            { required: true, message: "Please enter a title" },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Content"
                        rules={[
                            { required: true, message: "Please enter content" },
                        ]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item label="Media">
                        <Button type="dashed" onClick={handleOpenMediaModal}>
                            Select Media ({selectedMediaIds.length} selected)
                        </Button>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingBlog ? "Update" : "Create"}
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
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
                                const isVideoMedia = isVideo(item.url);
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
                                                            "https://via.placeholder.com/150?text=Image+Not+Found"
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
                            showSizeChanger={false}
                        />
                    </>
                )}
            </Modal>
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
                title={selectedBlog?.title || "Blog Details"}
                open={isDetailModalOpen}
                onCancel={handleCloseDetailModal}
                footer={null}
                width="80%"
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
                ) : selectedBlog ? (
                    <div>
                        <Title level={3}>{selectedBlog.title}</Title>
                        <Paragraph>{selectedBlog.content}</Paragraph>
                        {selectedBlog.media && selectedBlog.media.length > 0 && (
                            <>
                                <Title level={4}>Media</Title>
                                <Row gutter={[16, 16]}>
                                    {selectedBlog.media.map((item) => (
                                        <Col span={8} key={item.id}>
                                            {isVideo(item.url) ? (
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
                                                        "https://via.placeholder.com/150?text=Image+Not+Found"
                                                    }
                                                    style={{
                                                        height: 200,
                                                        objectFit: "cover",
                                                        width: "100%",
                                                    }}
                                                    onError={(e) =>
                                                        handleImageError(e, item)
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
                ) : (
                    <p>No blog data available.</p>
                )}
            </Modal>
        </div>
    );
}

export default BlogContent;