import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMediaContext } from "../context/MediaContext";
import {
    Layout,
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Upload,
    Alert,
    Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import SkeletonImage from "antd/es/skeleton/Image";

const { Title } = Typography;
const { Content } = Layout;

const BASE_API_URL = "";

function MediaContent() {
    const navigate = useNavigate();
    const media = useSelector((state) => {
        console.log("Redux state:", state); // Debug Redux state
        return (
            state.media.media || {
                data: [],
                current_page: 1,
                per_page: 10,
                total: 0,
                last_page: 1,
            }
        );
    });
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

    useEffect(() => {
        const loadMedia = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchMedia(1, 10);
            } catch (err) {
                setError(
                    err.response?.data?.error ||
                        err.message ||
                        "Failed to load media."
                );
            } finally {
                setLoading(false);
            }
        };

        loadMedia();

        // Poll every 30 seconds for updates
        const interval = setInterval(loadMedia, 30000);
        return () => clearInterval(interval);
    }, []);

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
            // No need to fetch media; Redux store is updated in MediaProvider
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
            // Fetch media after delete to update pagination
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
        form.setFieldsValue({
            title: media.title,
            type: media.status === 0 ? "video" : "image",
        });
        setSearchParams({ action: "edit", id: media.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
    };

    const handleRowClick = (record) => {
        navigate(`/media/${record.id}`);
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Preview",
            dataIndex: "thumbnail_url",
            key: "thumbnail_url",
            render: (_, record) => {
                const previewUrl = record.thumbnail_url || record.url;
                if (!previewUrl) {
                    return (
                        <SkeletonImage style={{ width: 400, height: 250 }} active/>
                    );
                }
                return (
                    <img
                        src={previewUrl}
                        alt={record.title}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                        loading="lazy"
                        onError={(e) => {
                            console.error(
                                `Failed to load image: ${previewUrl}`
                            );
                            e.target.src =
                                "https://via.placeholder.com/150?text=Image+Not+Found";
                        }}
                    />
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(record);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                        }}
                    >
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
                    <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" onClick={handleOpenCreate}>
                            Add Media
                        </Button>
                        <Button
                            type="default"
                            onClick={() =>
                                fetchMedia(media.current_page, media.per_page)
                            }
                        >
                            Refresh
                        </Button>
                    </Space>
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
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: "pointer" },
                        })}
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

export default MediaContent;
