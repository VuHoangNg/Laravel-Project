import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
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
import { useMediaContext } from "./context/MediaContext";
import ImageWithSkeleton from "../../../../../Core/Resources/assets/js/components/SkeletonImage";

const { Title } = Typography;
const { Content } = Layout;

const BASE_API_URL = "http://127.0.0.1:8000";

function MediaContent() {
    const navigate = useNavigate();
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
    const { createMediaContext, getMediaContext } = useMediaContext();
    const { resetForm, createMedia } = createMediaContext;
    const { isModalOpen, openModal, closeModal, fetchMedia } = getMediaContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true; // Track if component is mounted

        const loadMedia = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log(`Loading media: page=${page}, perPage=${perPage}`);
                await fetchMedia(page, perPage, {
                    signal: abortController.signal,
                });
            } catch (err) {
                if (err.name === "AbortError") {
                    console.log("Media fetch aborted");
                    return;
                }
                if (isMounted) {
                    setError(err.message || "Failed to load media.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadMedia();

        // Cleanup: Abort the fetch request and mark component as unmounted
        return () => {
            console.log("Cleaning up MediaContent useEffect");
            abortController.abort();
            isMounted = false;
        };
    }, [page, perPage, fetchMedia]);


    const handleTableChange = (pagination) => {
        const newPage = pagination.current;
        const newPerPage = pagination.pageSize;
        setSearchParams({
            page: newPage.toString(),
            perPage: newPerPage.toString(),
        });
        localStorage.setItem("lastMediaPage", newPage);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Creating media:", values);
            await createMedia(values);
            closeModal();
            setSearchParams({
                page: media.current_page.toString(),
                perPage: perPage.toString(),
            });
            form.resetFields();
            resetForm();
        } catch (error) {
            console.error("Error creating media:", error);
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
                setError(error.message || "Failed to save media.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        openModal();
        form.resetFields();
        resetForm();
        setSearchParams({
            action: "create",
            page: media.current_page.toString(),
            perPage: perPage.toString(),
        });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({
            page: media.current_page.toString(),
            perPage: perPage.toString(),
        });
        form.resetFields();
        resetForm();
    };

    const handleRowClick = (record) => {
        navigate(
            `/media/${record.id}?page=${media.current_page}&perPage=${perPage}`
        );
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
                return (
                    <ImageWithSkeleton
                        src={
                            previewUrl ||
                            "https://placehold.co/150x100?text=No+Preview"
                        }
                        alt={record.title}
                        style={{ maxWidth: 400, maxHeight: 250 }}
                    />
                );
            },
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
                            onClick={() => fetchMedia(page, perPage)}
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
                            pageSize: perPage,
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
                title="Add Media"
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
                                required: true,
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
                                Create
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Content>
    );
}

export default MediaContent;
