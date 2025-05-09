import React, { useRef, useEffect, useState } from "react";
import { Typography, Button, Upload, message, Form, Input, Space, Modal } from "antd";
import { InboxOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";
import { useMediaContext } from "../context/MediaContext";

const { Title } = Typography;
const { Dragger } = Upload;

const PreviewSidebar = ({
    showSplitter,
    siderWidth,
    selectedMedia,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isResizing,
    sidebarRef,
    videoRef,
    handleVideoPause,
    updateContentWidth,
    debouncedUpdateContentWidth,
}) => {
    const splitterRef = useRef(null);
    const { createMediaContext, getMediaContext } = useMediaContext();
    const { createMedia, setFormData, resetForm } = createMediaContext;
    const { editMedia, deleteMedia } = getMediaContext;
    const [form] = Form.useForm();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, debouncedUpdateContentWidth]);

    useEffect(() => {
        if (selectedMedia && isEditModalOpen) {
            form.setFieldsValue({ title: selectedMedia.title });
        }
    }, []);

    const customRequest = async ({ file, onSuccess, onError }) => {
        try {
            setFormData({ title: file.name, file });
            await createMedia({ title: file.name, file });
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
            return e;
        }
        return e && e.fileList;
    };

    const handleSubmitEdit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("title", values.title);
            if (values.file && values.file[0]) {
                formData.append("file", values.file[0].originFileObj);
            }
            await editMedia(selectedMedia.id, formData);
            message.success("Media updated successfully");
            setIsEditModalOpen(false);
            form.resetFields();
        } catch (error) {
            message.error("Failed to update media");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteMedia(selectedMedia.id);
            message.success("Media deleted successfully");
            setIsDeleteModalOpen(false);
        } catch (error) {
            message.error("Failed to delete media");
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
            <div style={{ display: "flex", height: "100vh", flexShrink: 0 }}>
                <div
                    ref={splitterRef}
                    style={{
                        width: "5px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        cursor: "col-resize",
                        height: "100%",
                    }}
                    onMouseDown={handleMouseDown}
                />
                <div
                    ref={sidebarRef}
                    style={{
                        width: `${siderWidth}px`,
                        backgroundColor: "rgba(28, 37, 38, 0.95)",
                        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "16px",
                        position: "relative",
                        backdropFilter: "blur(10px)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        height: "100vh",
                        flexShrink: 0,
                    }}
                >
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
                                    flex: 1,
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    padding: 0,
                                    marginBottom: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        position: "relative",
                                        backgroundColor: "#000",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                    }}
                                >
                                    {selectedMedia.type === "video" ||
                                    selectedMedia.url.includes("video") ? (
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
                                                height: "100%",
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
                                        {new Date().toLocaleDateString()}
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
                                    Support for a single upload. Strictly prohibited from
                                    uploading company data or other banned files.
                                </p>
                            </Dragger>
                        </div>
                    )}
                    {/* Edit Form */}
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
                    {/* Delete Confirmation Modal */}
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
            </div>
        )
    );
};

export default PreviewSidebar;