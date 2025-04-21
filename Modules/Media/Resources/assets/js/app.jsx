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

function MediaContent() {
    const media = useSelector((state) => state.media.media);
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

    React.useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleSubmit = async (values) => {
        setLoading(true);
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
        }
    };

    const handleDelete = (id) => {
        setSearchParams({ action: "delete", id });
        openDeleteModal(id);
    };

    const handleConfirmDelete = () => {
        deleteMedia(mediaToDelete);
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
                    />
                ) : (
                    <VideoPlayer
                        src={url}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                    />
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
            <Button
                type="primary"
                onClick={handleOpenCreate}
                style={{ marginBottom: 16 }}
            >
                Add Media
            </Button>
            <Table columns={columns} dataSource={media} rowKey="id" />
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
