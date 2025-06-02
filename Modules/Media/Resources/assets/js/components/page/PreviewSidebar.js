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
    handleVideoTimeUpdate,
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

    const handleEditSubmit = async (values) => {
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
                setIsEditModalOpen(false); // Close modal only on success
                onMediaUpdate?.(updatedMedia);
                const page = searchParams.get("page") || "1";
                const perPage = searchParams.get("perPage") || "8";
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
                setLoading(false); // Stop loading after success or failure
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
                const perPage = searchParams.get("perPage") || "8";
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
    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
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
            background: "#FFFFFF",
            border: "2px dashed #000000",
            borderRadius: 8,
            padding: 20,
            textAlign: "center",
        },
    };

    return (
        showSplitter && (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: `${contentHeight}px`,
                    width: siderWidth,
                    backgroundColor: "#FFFFFF",
                    borderRight: "1px solid #E0E0E0",
                    padding: 16,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "relative", // For positioning the loading overlay
                }}
            >
                {loading ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent overlay
                            zIndex: 10, // Ensure it’s on top
                        }}
                    >
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {error && (
                            <Alert
                                message="Error"
                                description={error}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setError(null)}
                                style={{
                                    marginBottom: 16,
                                    color: "#000000",
                                    borderRadius: 4,
                                }}
                            />
                        )}
                        {selectedMedia ? (
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 16,
                                        padding: "8px 0",
                                        borderBottom: "1px solid #E0E0E0",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Title
                                        level={4}
                                        style={{
                                            color: "#000000",
                                            margin: 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Preview
                                    </Title>
                                    <Space>
                                        <Button
                                            icon={<EditOutlined />}
                                            onClick={() =>
                                                setIsEditModalOpen(true)
                                            }
                                            style={{
                                                backgroundColor: "#1890ff",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                padding: "0 12px",
                                                fontSize: 14,
                                            }}
                                        />
                                        <Button
                                            icon={<DeleteOutlined />}
                                            onClick={handleOpenDelete}
                                            style={{
                                                backgroundColor: "#ff4d4f",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                padding: "0 12px",
                                                fontSize: 14,
                                            }}
                                        />
                                    </Space>
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        background: "#F9F9F9",
                                        borderRadius: 8,
                                        border: "1px solid #E0E0E0",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            position: "relative",
                                            backgroundColor: "#000",
                                            borderRadius: "8px 8px 0 0",
                                            overflow: "hidden",
                                            minHeight: 0,
                                        }}
                                    >
                                        {selectedMedia.status === 0 ? (
                                            <div
                                                style={{
                                                    color: "#000000",
                                                    padding: 16,
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
                                                    height: "100%",
                                                    objectFit: "contain",
                                                    display: "block",
                                                }}
                                                onPause={handleVideoPause}
                                                onTimeUpdate={
                                                    handleVideoTimeUpdate
                                                }
                                                autoPlay={false}
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    selectedMedia.thumbnail_url ||
                                                    selectedMedia.url ||
                                                    "https://placehold.co/150x100?text=Image+Not+Found"
                                                }
                                                alt={selectedMedia.title}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                    display: "block",
                                                }}
                                                loading="lazy"
                                                onError={() =>
                                                    console.error(
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
                                            padding: 12,
                                            color: "#000000",
                                            flexShrink: 0,
                                            borderTop: "1px solid #E0E0E0",
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontWeight: 500,
                                                fontSize: 16,
                                            }}
                                        >
                                            {selectedMedia.title}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 12,
                                                color: "#666666",
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
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    background: "#F9F9F9",
                                    border: "2px dashed #000000",
                                    borderRadius: 8,
                                }}
                            >
                                <Dragger {...draggerProps}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p
                                        className="ant-upload-text"
                                        style={{
                                            color: "#000000",
                                            fontSize: 16,
                                        }}
                                    >
                                        Click or drag file to this area to
                                        upload
                                    </p>
                                    <p
                                        className="ant-upload-hint"
                                        style={{
                                            color: "#666666",
                                            fontSize: 12,
                                        }}
                                    >
                                        Support for a single upload. Strictly
                                        prohibited from uploading company data
                                        or other banned files.
                                    </p>
                                </Dragger>
                            </div>
                        )}
                        <Modal
                            title="Edit Media"
                            open={isEditModalOpen}
                            onCancel={() => setIsEditModalOpen(false)}
                            footer={[
                                <Button
                                    key="submit"
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    style={{ borderRadius: 4 }}
                                    onClick={() => form.submit()}
                                >
                                    Save
                                </Button>,
                                <Button
                                    key="cancel"
                                    type="default"
                                    onClick={handleCancelEdit}
                                    style={{ borderRadius: 4 }}
                                >
                                    Cancel
                                </Button>,
                            ]}
                            style={{ top: 20 }}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleEditSubmit}
                                style={{
                                    background: "#FFFFFF",
                                    borderRadius: 8,
                                    color: "#000000",
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
                                    <Input
                                        style={{
                                            color: "#000000",
                                            borderRadius: 4,
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="file"
                                    label="Replace File"
                                    getValueFromEvent={normFile}
                                >
                                    <Dragger
                                        name="file"
                                        multiple={false}
                                        beforeUpload={() => false}
                                        accept="image/*,video/*"
                                        maxCount={1}
                                        onChange={(info) => {
                                            console.log(
                                                info.file,
                                                info.fileList
                                            );
                                        }}
                                        onDrop={(e) => {
                                            console.log(
                                                "Dropped files",
                                                e.dataTransfer.files
                                            );
                                        }}
                                        style={{
                                            background: "#FFFFFF",
                                            border: "2px dashed #000000",
                                            borderRadius: 8,
                                            padding: 20,
                                            textAlign: "center",
                                        }}
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        <p
                                            className="ant-upload-text"
                                            style={{
                                                color: "#000000",
                                                fontSize: 16,
                                            }}
                                        >
                                            Click or drag file to this area to
                                            upload
                                        </p>
                                        <p
                                            className="ant-upload-hint"
                                            style={{
                                                color: "#666666",
                                                fontSize: 12,
                                            }}
                                        >
                                            Support for a single upload. Strictly
                                            prohibited from uploading company
                                            data or other banned files.
                                        </p>
                                    </Dragger>
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
                            style={{ top: 20 }}
                        >
                            <p style={{ color: "#000000", fontSize: 16 }}>
                                Are you sure you want to delete this media?
                            </p>
                        </Modal>
                    </>
                )}
            </div>
        )
    );
};

export default PreviewSidebar;