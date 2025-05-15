import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Typography,
    Button,
    Upload,
    message,
    Form,
    Input,
    Space,
    Modal,
    Alert,
    Spin,
} from "antd";
import {
    InboxOutlined,
    UploadOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";
import { useMediaContext } from "../context/MediaContext";

const { Title } = Typography;
const { Dragger } = Upload;

const PreviewSidebar = ({
    showSplitter,
    siderWidth,
    selectedMedia,
    videoRef,
    handleVideoPause,
    onMediaUpdate,
    contentHeight,
}) => {
    const { createMediaContext, getMediaContext } = useMediaContext();
    const { createMedia, setFormData, resetForm } = createMediaContext;
    const { editMedia, deleteMedia } = getMediaContext;
    const [form] = Form.useForm();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isMounted = useRef(false);

    // Calculate heights for preview content
    const titleHeight = 40; // Approximate height of title and buttons
    const infoHeight = 60; // Height of title and date info below media
    const padding = 32; // Padding within the sidebar
    const mediaHeight = contentHeight - titleHeight - infoHeight - padding;

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (selectedMedia && isEditModalOpen) {
            form.setFieldsValue({ title: selectedMedia.title });
        }
        if (!isEditModalOpen) {
            form.resetFields();
        }
    }, [selectedMedia, isEditModalOpen, form]);

    const customRequest = async ({ file, onSuccess, onError }) => {
        try {
            setFormData({ title: file.name, file });
            await createMediaContext.createMedia({ title: file.name, file });
            message.success(`${file.name} file uploaded successfully.`);
            resetForm();
            onSuccess("ok");
        } catch (error) {
            message.error(`${file.name} file upload failed.`);
            onError(error);
        }
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e.length > 0 ? e[0].originFileObj : null;
        }
        return e && e.fileList && e.fileList.length > 0
            ? e.fileList[0].originFileObj
            : null;
    };

    const handleSubmitEdit = async (values) => {
        if (!selectedMedia?.id) {
            setError("No media selected for editing.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            const title = values.title?.trim() || selectedMedia.title;
            formData.append("title", title);
            if (values.file) {
                formData.append("file", values.file);
            }
            formData.append("_method", "PUT");

            const updatedMedia = await editMedia(selectedMedia.id, formData);
            if (isMounted.current) {
                form.setFieldsValue({ title: updatedMedia.title });
                message.success("Media updated successfully");
                setIsEditModalOpen(false);
                onMediaUpdate?.(updatedMedia);

                const page = searchParams.get("page") || "1";
                const perPage = searchParams.get("perPage") || "12";
                await getMediaContext.fetchMedia(page, perPage);
            }
        } catch (error) {
            console.error(
                "Edit media error:",
                error.response?.data || error.message
            );
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
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleOpenDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedMedia?.id) {
            setError("No media selected for deletion.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await deleteMedia(selectedMedia.id);
            if (isMounted.current) {
                message.success("Media deleted successfully");
                setIsDeleteModalOpen(false);
                const page = searchParams.get("page") || "1";
                const perPage = searchParams.get("perPage") || "12";
                navigate(`/media?page=${page}&perPage=${perPage}`);
                onMediaUpdate?.(null);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to delete media. Please try again."
            );
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
    };

    const draggerProps = {
        name: "file",
        multiple: false,
        customRequest,
        onChange(info) {
            const { status } = info.file;
            if (status !== "uploading") {
                console.log(info.file, info.fileList);
            }
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
        style: {
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px dashed rgba(255, 255, 255, 0.3)",
            borderRadius: "8px",
            padding: "20px",
        },
    };

    return (
        showSplitter && (
            <div
                style={{
                    width: `${siderWidth}px`,
                    backgroundColor: "rgba(28, 37, 38, 0.95)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "16px",
                    position: "relative",
                    backdropFilter: "blur(10px)",
                    overflowX: "hidden",
                    overflowY: "hidden",
                    height: contentHeight,
                    flexShrink: 0,
                }}
            >
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
                {selectedMedia ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                marginBottom: "16px",
                                flexShrink: 0,
                                height: titleHeight,
                            }}
                        >
                            <Title
                                level={4}
                                style={{ color: "#fff", margin: 0 }}
                            >
                                Preview
                            </Title>
                            <Space style={{ marginLeft: "20px" }}>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => setIsEditModalOpen(true)}
                                    style={{
                                        backgroundColor: "#1890ff",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                    }}
                                />
                                <Button
                                    icon={<DeleteOutlined />}
                                    onClick={handleOpenDelete}
                                    style={{
                                        backgroundColor: "#ff4d4f",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                    }}
                                />
                            </Space>
                        </div>
                        <div
                            style={{
                                flex: 1, // Take remaining space
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "8px",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                marginBottom: "16px",
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden", // Ensure no overflow
                            }}
                        >
                            <div
                                style={{
                                    flex: 1, // Take all available space
                                    position: "relative",
                                    backgroundColor: "#000",
                                    borderRadius: "8px 8px 0 0", // Rounded top corners
                                    overflow: "hidden",
                                }}
                            >
                                {selectedMedia.status === 0 ? (
                                    <div
                                        style={{
                                            color: "#fff",
                                            padding: "16px",
                                            textAlign: "center",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        Media is processing...
                                    </div>
                                ) : selectedMedia.type === "video" ||
                                  selectedMedia.url.includes(".m3u8") ? (
                                    <VideoPlayer
                                        ref={videoRef}
                                        src={selectedMedia.url}
                                        style={{
                                            width: "100%",
                                            height: "100%", // Full height of the container
                                            objectFit: "contain",
                                            display: "block",
                                        }}
                                        onPause={handleVideoPause}
                                        autoPlay={false}
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={
                                            selectedMedia.thumbnail_url ||
                                            selectedMedia.url ||
                                            "https://placehold.co/150x100?text=No+Preview"
                                        }
                                        alt={selectedMedia.title}
                                        style={{
                                            width: "100%",
                                            height: "100%", // Full height of the container
                                            objectFit: "contain",
                                            display: "block",
                                        }}
                                        loading="lazy"
                                        onError={() =>
                                            console.log(
                                                "Image load error for:",
                                                selectedMedia.thumbnail_url ||
                                                    selectedMedia.url
                                            )
                                        }
                                    />
                                )}
                            </div>
                            <div
                                style={{
                                    padding: "8px",
                                    color: "#fff",
                                    flexShrink: 0,
                                    height: infoHeight,
                                }}
                            >
                                <p style={{ margin: 0, fontWeight: 500 }}>
                                    {selectedMedia.title}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "12px",
                                        opacity: 0.7,
                                    }}
                                >
                                    Uploaded on{" "}
                                    {new Date(
                                        selectedMedia.created_at ||
                                            new Date()
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
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
                        <Dragger {...draggerProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                Click or drag file to this area to upload
                            </p>
                            <p className="ant-upload-hint">
                                Support for a single upload. Strictly
                                prohibited from uploading company data or
                                other banned files.
                            </p>
                        </Dragger>
                    </div>
                )}
                <Modal
                    title="Edit Media"
                    open={isEditModalOpen}
                    onCancel={() => setIsEditModalOpen(false)}
                    footer={null}
                >
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
                                {
                                    min: 1,
                                    message: "Title cannot be empty",
                                },
                                {
                                    whitespace: true,
                                    message:
                                        "Title cannot be only whitespace",
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
            </div>
        )
    );
};

export default PreviewSidebar;