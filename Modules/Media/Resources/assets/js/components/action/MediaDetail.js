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
} from "antd";
import { useMediaContext } from "../context/MediaContext";
import { UploadOutlined } from "@ant-design/icons";
import ImageWithSkeleton from "../../../../../../Core/Resources/assets/js/components/SkeletonImage";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/VideoPlayer";

const { Title } = Typography;

function MediaDetail({ api }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { getMediaContext } = useMediaContext();
    const { fetchMediaById } = getMediaContext;

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchMediaData();

        return () => {
            isMounted.current = false;
        };
    }, []);

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
            console.log(`Deleting media with ID: ${id}`);
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
        const perPage = searchParams.get("perPage") || "10";
        navigate(`/media?page=${page}&perPage=${perPage}`);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Edit Media</Title>
            <Button onClick={handleBack} style={{ marginBottom: 16 }}>
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
                        <Title level={4}>Preview</Title>
                        {media.status === 0 ? (
                            <div>Media is processing...</div>
                        ) : media.url && media.url.includes(".m3u8") ? (
                            <VideoPlayer
                                src={media.url}
                                style={{ maxWidth: "100%", maxHeight: 300 }}
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
