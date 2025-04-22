import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { MediaProvider, useMediaContext } from "./context/mediaContext";
import {
    Layout,
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Select,
    Upload,
    Alert,
    Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import Hls from "hls.js";

const { Title } = Typography;
const { Content } = Layout;
const { Option } = Select;

// Custom VideoPlayer component to handle HLS playback
const VideoPlayer = ({ src, style }) => {
    const videoRef = useRef(null);

    useEffect(() => {
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

function MediaContent() {
    const media = useSelector(
        (state) =>
            state.media.media || {
                data: [],
                current_page: 1,
                per_page: 10,
                total: 0,
                last_page: 1,
            }
    );
    const {
        createMediaContext,
        editingMediaContext,
        getMediaContext,
        deleteMediaContext,
    } = useMediaContext();
    const { resetForm, createMedia } = createMediaContext;
    const { editingMedia, updateMedia } = editingMediaContext;
    const { isModalOpen, openModal, closeModal, fetchMedia } = getMediaContext;
    const {
        isDeleteModalOpen,
        mediaToDelete,
        openDeleteModal,
        closeDeleteModal,
        deleteMedia,
    } = deleteMediaContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const loadMedia = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchMedia(1, 10);
            } catch (err) {
                setError(
                    err.response?.data?.error ||
                        err.message ||
                        "Failed to load media. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };
        loadMedia();
    }, [fetchMedia]);

    const handleTableChange = (pagination) => {
        setLoading(true);
        fetchMedia(pagination.current, pagination.pageSize).finally(() => {
            setLoading(false);
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            if (editingMedia) {
                await updateMedia(editingMedia.id, values);
            } else {
                await createMedia(values);
            }
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
            // Reload media with current pagination
            await fetchMedia(media.current_page, media.per_page);
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
                setError(
                    error.response?.data?.error ||
                        error.message ||
                        "Failed to save media. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setSearchParams({ action: "delete", id });
        openDeleteModal(id);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await deleteMedia(mediaToDelete);
            closeDeleteModal();
            setSearchParams({});
            // Reload media with current pagination
            await fetchMedia(media.current_page, media.per_page);
        } catch (error) {
            setError(
                error.response?.data?.error ||
                    error.message ||
                    "Failed to delete media. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        closeDeleteModal();
        setSearchParams({});
    };

    const handleOpenCreate = () => {
        openModal();
        form.resetFields();
        form.setFieldsValue({ title: "", file: null, type: "" });
        resetForm();
        setSearchParams({ action: "create" });
    };

    const handleOpenEdit = (media) => {
        openModal(media);
        form.resetFields();
        form.setFieldsValue({ title: media.title, type: media.type });
        setSearchParams({ action: "edit", id: media.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
        },
        {
            title: "Preview",
            dataIndex: "url",
            key: "url",
            render: (url, record) =>
                record.type === "image" ? (
                    <img
                        src={url}
                        alt={record.title}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                        onError={(e) => {
                            console.error(`Failed to load image: ${url}`);
                            e.target.src =
                                "https://via.placeholder.com/150?text=Image+Not+Found";
                        }}
                    />
                ) : (
                    <VideoPlayer
                        src={url}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                    />
                ),
        },
        {
            title: "Thumbnail",
            dataIndex: "thumbnail_url",
            key: "thumbnail_url",
            render: (thumbnail_url, record) =>
                record.type === "video" ? (
                    <img
                        src={
                            thumbnail_url ||
                            "https://via.placeholder.com/150?text=Thumbnail+Not+Found"
                        }
                        alt={record.title}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                        onError={(e) => {
                            console.error(
                                `Failed to load thumbnail: ${thumbnail_url}`
                            );
                            e.target.src =
                                "https://via.placeholder.com/150?text=Thumbnail+Not+Found";
                        }}
                    />
                ) : null,
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

    return (
        <Content style={{ padding: "24px" }}>
            <Title level={2}>Media Management</Title>
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
            {loading && (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <Spin size="large" />
                </div>
            )}
            {!loading && (
                <>
                    <Button
                        type="primary"
                        onClick={handleOpenCreate}
                        style={{ marginBottom: 16 }}
                    >
                        Add Media
                    </Button>
                    <Table
                        columns={columns}
                        dataSource={media.data || []}
                        rowKey="id"
                        scroll={{ x: "max-content" }}
                        pagination={{
                            current: media.current_page,
                            pageSize: media.per_page,
                            total: media.total,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText:
                                "No media available. Upload some media to get started!",
                        }}
                    />
                </>
            )}
            <Modal
                title={editingMedia ? "Edit Media" : "Add Media"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                        name="type"
                        label="Media Type"
                        rules={[
                            {
                                required: true,
                                message: "Please select a media type",
                            },
                        ]}
                    >
                        <Select>
                            <Option value="image">Image</Option>
                            <Option value="video">Video</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="file"
                        label="File"
                        getValueFromEvent={normFile}
                        rules={[
                            {
                                required: !editingMedia,
                                message: "Please upload a file",
                            },
                        ]}
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
                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                {editingMedia ? "Update" : "Create"}
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
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
        </Content>
    );
}

function Media({ api }) {
    return (
        <MediaProvider api={api}>
            <Layout>
                <MediaContent />
            </Layout>
        </MediaProvider>
    );
}

export default Media;