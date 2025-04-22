import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BlogProvider, useBlogContext } from "./context/BlogContext";
import {
    Layout,
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
} from "antd";
import { useSearchParams } from "react-router-dom";
import Hls from "hls.js";

const { Title } = Typography;
const { Content } = Layout;
const { Meta } = Card;

// Custom VideoPlayer component to handle HLS playback
const VideoPlayer = ({ src, style }) => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch((error) => {
                    console.error("Video playback failed:", error);
                });
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("HLS error:", event, data);
            });
            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // For browsers with native HLS support (e.g., Safari)
            video.src = src;
            video.play().catch((error) => {
                console.error("Video playback failed:", error);
            });
        } else {
            console.error("HLS is not supported in this browser");
        }
    }, [src]);

    return (
        <video
            ref={videoRef}
            controls
            style={style}
            type="application/x-mpegURL"
        />
    );
};

function BlogContent({ api }) {
    const dispatch = useDispatch();
    const blogs = useSelector((state) => state.blogs.blogs);
    const media = useSelector((state) => state.media.media);
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

    React.useEffect(() => {
        fetchBlogs();
        // Fetch media if not already loaded
        if (!media.length) {
            const fetchMedia = async () => {
                try {
                    const response = await api.get("/api/media");
                    dispatch({
                        type: "media/setMedia",
                        payload: response.data,
                    });
                } catch (error) {
                    console.error("Failed to fetch media:", error);
                    throw error;
                }
            };
            fetchMedia();
        }
    }, [fetchBlogs, dispatch, media.length, api]);

    // Debug media data
    React.useEffect(() => {
        console.log("Media data:", media);
    }, [media]);

    const handleSubmit = async (values) => {
        try {
            if (editingBlog) {
                await updateBlog(editingBlog.id, values);
            } else {
                await createBlog(values);
            }
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
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
        form.resetFields();
        form.setFieldsValue({ title: "", content: "", thumbnail_id: null });
        resetForm();
        setSearchParams({ action: "create" });
    };

    const handleOpenEdit = (blog) => {
        openModal(blog);
        form.resetFields();
        form.setFieldsValue({
            title: blog.title,
            content: blog.content,
            thumbnail_id: blog.thumbnail_id || null,
        });
        setSearchParams({ action: "edit", id: blog.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
    };

    const handleOpenMediaModal = () => {
        setIsMediaModalOpen(true);
    };

    const handleCloseMediaModal = () => {
        setIsMediaModalOpen(false);
    };

    const handleSelectMedia = (mediaId) => {
        form.setFieldsValue({ thumbnail_id: mediaId });
        setIsMediaModalOpen(false);
    };

    const handleImageError = (e, item) => {
        console.error(
            `Failed to load image for ${item?.title || "unknown"}:`,
            item?.url,
            item?.thumbnail
        );
        e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
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
            render: (text) => text.substring(0, 50) + "...",
        },
        {
            title: "Thumbnail",
            dataIndex: "thumbnail",
            key: "thumbnail",
            render: (thumbnail) =>
                thumbnail ? (
                    thumbnail.type === "image" ? (
                        <img
                            src={thumbnail.url}
                            alt={thumbnail.title}
                            style={{ maxWidth: 400, maxHeight: 250 }}
                            onError={(e) => handleImageError(e, thumbnail)}
                        />
                    ) : (
                        <VideoPlayer
                            src={thumbnail.url}
                            style={{ maxWidth: 400, maxHeight: 250 }}
                        />
                    )
                ) : (
                    "No Thumbnail"
                ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button onClick={() => handleOpenEdit(record)}>Edit</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Content style={{ padding: "24px" }}>
            <Title level={2}>Blog Management</Title>
            <Button
                type="primary"
                onClick={handleOpenCreate}
                style={{ marginBottom: 16 }}
            >
                Add Blog
            </Button>
            <Table columns={columns} dataSource={blogs} rowKey="id" />
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
                    <Form.Item
                        name="thumbnail_id"
                        label="Thumbnail"
                        rules={[
                            {
                                required: true,
                                message: "Please select a thumbnail",
                            },
                        ]}
                    >
                        <Button type="dashed" onClick={handleOpenMediaModal}>
                            Select Thumbnail
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
                width={"100%"}
                height={"flex"}
            >
                <Row gutter={[16, 16]}>
                    {media.map((item) => (
                        <Col span={8} key={item.id}>
                            <Card
                                hoverable
                                cover={
                                    item.type === "image" ? (
                                        <img
                                            alt={item.title}
                                            src={item.url}
                                            style={{
                                                height: 250,
                                                objectFit: "cover",
                                            }}
                                            onError={(e) =>
                                                handleImageError(e, item)
                                            }
                                        />
                                    ) : (
                                        <VideoPlayer
                                            src={item.url}
                                            style={{
                                                height: 250,
                                                objectFit: "cover",
                                            }}
                                        />
                                    )
                                }
                                onClick={() => handleSelectMedia(item.id)}
                            >
                                <Meta
                                    title={item.title}
                                    description={item.type}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
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
        </Content>
    );
}

function Blog({ api }) {
    return (
        <BlogProvider api={api}>
            <Layout>
                <BlogContent api={api} />
            </Layout>
        </BlogProvider>
    );
}

export default Blog;
