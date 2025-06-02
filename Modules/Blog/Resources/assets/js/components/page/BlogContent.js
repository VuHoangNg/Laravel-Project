import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Button,
    Drawer,
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
    Carousel,
    ConfigProvider,
    Tooltip,
    Modal,
    message,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { useBlogContext } from "../context/BlogContext";
import {
    PlusOutlined,
    CloseOutlined,
    EditOutlined,
    LineChartOutlined,
} from "@ant-design/icons";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import BlogDetail from "../action/BlogDetail";
import ReportDashboard from "./ReportDashboard";
const { Title } = Typography;
const { Meta } = Card;

const theme = {
    token: {
        colorPrimary: "#4A90E2",
        colorBgBase: "#FFFFFF",
        colorTextBase: "#333333",
        colorBorder: "#E8E8E8",
        borderRadius: 8,
        fontSize: 16,
    },
    components: {
        Card: { borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" },
        Modal: { colorBgElevated: "#FFFFFF", colorText: "#333333" },
        Button: {
            primaryColor: "#FFFFFF",
            primaryBg: "#4A90E2",
            defaultBorderColor: "#E8E8E8",
            borderRadius: 6,
        },
        Alert: { colorBgAlert: "#FFF1F0", colorText: "#333333" },
        Carousel: { dotBg: "#E8E8E8", dotActiveBg: "#4A90E2" },
        Pagination: { colorPrimary: "#4A90E2", colorText: "#333333" },
        Drawer: { colorBgElevated: "#FFFFFF", colorText: "#333333" },
    },
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
};

function BlogContent({ api }) {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const blogs = useSelector(
        (state) =>
            state.blogs?.blogs || {
                data: [],
                current_page: 1,
                per_page: 8,
                total: 0,
            }
    );
    const media = useSelector(
        (state) =>
            state.blogs?.media || {
                data: [],
                current_page: 1,
                per_page: 8,
                total: 0,
            }
    );
    const {
        createBlogContext: { resetForm, createBlog },
        getBlogContext: { isModalOpen, openModal, closeModal, fetchBlogs },
    } = useBlogContext();
    const [form] = Form.useForm();
    const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [mediaPagination, setMediaPagination] = useState({
        currentPage: 1,
        limit: 8,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportBlogId, setReportBlogId] = useState(null);
    const [contentWidth, setContentWidth] = useState(window.innerWidth);
    const [failedImages, setFailedImages] = useState(new Set());
    const [isBlogDetailDrawerOpen, setIsBlogDetailDrawerOpen] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState(null);

    const cardStyles = {
        maxWidth: 450,
        width: "100%",
        border: "1px solid #E8E8E8",
        borderRadius: 8,
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    };
    const imageContainerStyles = {
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 2",
        overflow: "hidden",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    };
    const imageStyles = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        loading: "lazy",
    };

    useEffect(() => {
        const handleResize = () => setContentWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        loadBlogs();
    }, [searchParams.get("page"), searchParams.get("perPage")]);

    useEffect(() => {
        if (isMediaDrawerOpen) fetchMedia();
    }, [mediaPagination.currentPage, mediaPagination.limit, isMediaDrawerOpen]);

    const handleError = (err, defaultMsg) => {
        const msg = err.response?.data?.message || defaultMsg;
        setError(msg);
        message.error(msg);
        setLoading(false);
        setDrawerLoading(false);
    };

    const loadBlogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const page =
                parseInt(searchParams.get("page")) || blogs.current_page;
            const perPage = parseInt(searchParams.get("perPage")) || 8;
            await fetchBlogs(page, perPage);
        } catch (err) {
            handleError(err, "Failed to load blogs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchMedia = async () => {
        setDrawerLoading(true);
        setError(null);
        try {
            const { data } = await api.get(
                `/api/media?perPage=${mediaPagination.limit}&page=${mediaPagination.currentPage}&fields=id,title,media_url,thumbnail_url,media_type&blog_id=null`
            );
            dispatch(setMedia(data));
            setMediaPagination((prev) => ({ ...prev, total: data.total }));
        } catch (err) {
            handleError(err, "Failed to load media.");
        } finally {
            setDrawerLoading(false);
        }
    };

    const handleTableChange = (page, pageSize) => {
        setLoading(true);
        setError(null);
        try {
            setSearchParams({
                page: page.toString(),
                perPage: pageSize.toString(),
            });
            fetchBlogs(page, pageSize);
        } catch (err) {
            handleError(err, "Failed to load blogs.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Submitting blog data:", { ...values, media_ids: selectedMediaIds });
            const createResponse = await createBlog({ ...values, media_ids: selectedMediaIds });
            console.log("Create blog response:", createResponse);
            message.success("Blog created successfully");
            closeModal();
            setSearchParams({}); // Clear all query params after creation
            form.resetFields();
            resetForm();
            setSelectedMediaIds([]);
            try {
                console.log("Fetching blogs after creation...");
                await fetchBlogs(blogs.current_page, blogs.per_page);
                console.log("Blogs fetched successfully");
            } catch (fetchErr) {
                console.error("Error fetching blogs after creation:", fetchErr);
                handleError(fetchErr, "Blog created, but failed to refresh blog list.");
            }
        } catch (err) {
            console.error("Error during blog creation process:", {
                message: err.message,
                response: err.response,
                status: err.response?.status,
                data: err.response?.data,
            });
            if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                form.setFields(
                    Object.keys(errors).map((key) => ({
                        name: key,
                        errors: errors[key],
                    }))
                );
            } else {
                handleError(err, "Failed to save blog.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImageError = (e, item, srcUrl) => {
        if (!failedImages.has(srcUrl)) {
            console.error("Image failed to load:", item, "URL:", srcUrl);
            setFailedImages((prev) => new Set(prev).add(srcUrl));
            e.target.src =
                "https://via.placeholder.com/450?text=Image+Not+Found";
        }
    };

    const getColSpan = () =>
        contentWidth >= 1400
            ? 6
            : contentWidth >= 1200
            ? 8
            : contentWidth >= 900
            ? 12
            : 24;

    const colSpan = getColSpan();
    const isScrollable = colSpan !== 6;

    const carouselSettings = {
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        dotPosition: "bottom",
        dots: true,
        arrows: true,
        accessibility: true,
    };

    const handleCloseMediaDrawer = () => {
        setIsMediaDrawerOpen(false);
        setError(null);
    };

    const handleSelectMedia = (id) => {
        setSelectedMediaIds((prev) =>
            prev.includes(id)
                ? prev.filter((mediaId) => mediaId !== id)
                : [...prev, id]
        );
    };

    const handleSaveMediaSelection = () => {
        setIsMediaDrawerOpen(false);
        message.success("Media selection saved");
    };

    const handleMediaPageChange = (page, pageSize) => {
        setMediaPagination({
            ...mediaPagination,
            currentPage: page,
            limit: pageSize,
        });
    };

    if (loading)
        return (
            <Spin
                size="large"
                tip="Loading blogs..."
                style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
        );

    return (
        <ConfigProvider theme={theme}>
            <section
                style={{
                    padding: 24,
                    background: "#FFFFFF",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Row
                    justify="space-between"
                    align="middle"
                    style={{ marginBottom: 24 }}
                >
                    <Col>
                        <Title
                            level={2}
                            style={{
                                margin: 0,
                                color: "#333333",
                                fontWeight: 600,
                                fontSize: 24,
                            }}
                        >
                            Blog Management
                        </Title>
                    </Col>
                    <Col>
                        <Tooltip title="Create New Blog">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    openModal();
                                    form.resetFields();
                                    resetForm();
                                    setSelectedMediaIds([]);
                                    // Preserve existing page and perPage
                                    setSearchParams((prev) => {
                                        const params = {};
                                        if (prev.get("page"))
                                            params.page = prev.get("page");
                                        if (prev.get("perPage"))
                                            params.perPage = prev.get("perPage");
                                        params.action = "create";
                                        return params;
                                    });
                                }}
                                aria-label="Create new blog"
                            >
                                Create Blog
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        style={{ marginBottom: 24 }}
                        action={
                            <Button size="small" onClick={loadBlogs}>
                                Retry
                            </Button>
                        }
                    />
                )}
                <div
                    style={{
                        flex: 1,
                        overflowY: isScrollable ? "auto" : "hidden",
                        paddingBottom: 64,
                        overflowX: "hidden",
                    }}
                >
                    <Row gutter={[16, 16]}>
                        {blogs.data.length ? (
                            blogs.data.map((blog) => (
                                <Col span={colSpan} key={blog.id}>
                                    <Card
                                        hoverable
                                        actions={[
                                            <Tooltip
                                                title="Edit Blog"
                                                key="edit"
                                            >
                                                <EditOutlined
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBlogId(
                                                            blog.id
                                                        );
                                                        setIsBlogDetailDrawerOpen(
                                                            true
                                                        );
                                                    }}
                                                    aria-label="Edit blog"
                                                />
                                            </Tooltip>,
                                            <Tooltip
                                                title="View Report"
                                                key="analyze"
                                            >
                                                <LineChartOutlined
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReportBlogId(
                                                            blog.id
                                                        );
                                                    }}
                                                    aria-label="View report"
                                                />
                                            </Tooltip>,
                                        ]}
                                        cover={
                                            blog.media?.length ? (
                                                <div
                                                    style={{
                                                        aspectRatio: "16/9",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Carousel
                                                        {...carouselSettings}
                                                    >
                                                        {blog.media.map(
                                                            (item) => {
                                                                const srcUrl =
                                                                    item.type ===
                                                                        "video" &&
                                                                    item.thumbnail_url
                                                                        ? item.thumbnail_url
                                                                        : item.url ||
                                                                          "https://via.placeholder.com/150?text=Image+Not+Found";
                                                                return (
                                                                    <div
                                                                        key={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        <img
                                                                            alt={
                                                                                item.title ||
                                                                                "Blog Media"
                                                                            }
                                                                            src={
                                                                                failedImages.has(
                                                                                    srcUrl
                                                                                )
                                                                                    ? "https://via.placeholder.com/150?text=Image+Not+Found"
                                                                                    : srcUrl
                                                                            }
                                                                            style={{
                                                                                width: "100%",
                                                                                height: 200,
                                                                                objectFit:
                                                                                    "cover",
                                                                                loading:
                                                                                    "lazy",
                                                                            }}
                                                                            onError={(
                                                                                e
                                                                            ) =>
                                                                                handleImageError(
                                                                                    e,
                                                                                    item,
                                                                                    srcUrl
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </Carousel>
                                                </div>
                                            ) : (
                                                <img
                                                    alt="No Media"
                                                    src="https://via.placeholder.com/150?text=No+Media"
                                                    style={{
                                                        aspectRatio: "16/9",
                                                        objectFit: "cover",
                                                        height: 200,
                                                    }}
                                                />
                                            )
                                        }
                                    >
                                        <Meta
                                            title={
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        fontSize: 16,
                                                    }}
                                                >
                                                    {blog.title}
                                                </span>
                                            }
                                            description={
                                                blog.content && (
                                                    <span
                                                        style={{
                                                            color: "#666666",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        {blog.content.slice(
                                                            0,
                                                            50
                                                        ) + "..."}
                                                    </span>
                                                )
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Col span={24}>
                                <Alert
                                    message={
                                        blogs.current_page === 1
                                            ? "No Blogs Available"
                                            : "No More Blogs"
                                    }
                                    description={
                                        blogs.current_page === 1
                                            ? "Create a new blog to get started!"
                                            : "There are no more blogs to display on this page."
                                    }
                                    type="info"
                                    showIcon
                                    style={{
                                        backgroundColor: "#E6F7FF",
                                        border: "1px solid #91D5FF",
                                    }}
                                    action={
                                        blogs.current_page === 1 && (
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => {
                                                    openModal();
                                                    form.resetFields();
                                                    resetForm();
                                                    setSelectedMediaIds([]);
                                                    setSearchParams((prev) => {
                                                        const params = {};
                                                        if (prev.get("page"))
                                                            params.page = prev.get("page");
                                                        if (prev.get("perPage"))
                                                            params.perPage = prev.get("perPage");
                                                        params.action = "create";
                                                        return params;
                                                    });
                                                }}
                                            >
                                                Create Blog
                                            </Button>
                                        )
                                    }
                                />
                            </Col>
                        )}
                    </Row>
                </div>
                <Row
                    style={{
                        position: "sticky",
                        bottom: 0,
                        backgroundColor: "#FFFFFF",
                        padding: "12px 0",
                        borderTop: "1px solid #E8E8E8",
                        textAlign: "end",
                        zIndex: 10,
                        display: "block",
                    }}
                >
                    <Pagination
                        current={blogs.current_page}
                        pageSize={blogs.per_page}
                        total={blogs.total}
                        onChange={handleTableChange}
                        showSizeChanger
                        pageSizeOptions={["8", "16", "24"]}
                        disabled={loading}
                        style={{
                            borderRadius: 8,
                            display: "inline-block",
                        }}
                    />
                </Row>
                <Modal
                    title="Add Blog"
                    open={isModalOpen}
                    onCancel={() => {
                        closeModal();
                        setSearchParams((prev) => {
                            // Preserve page and perPage when closing modal
                            const params = {};
                            if (prev.get("page"))
                                params.page = prev.get("page");
                            if (prev.get("perPage"))
                                params.perPage = prev.get("perPage");
                            return params;
                        });
                        form.resetFields();
                        resetForm();
                        setSelectedMediaIds([]);
                    }}
                    footer={null}
                    style={{ textAlign: "end" }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
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
                            <Input placeholder="Enter blog title" />
                        </Form.Item>
                        <Form.Item
                            name="content"
                            label="Content"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter content",
                                },
                            ]}
                        >
                            <Input.TextArea
                                rows={4}
                                placeholder="Enter blog content"
                            />
                        </Form.Item>
                        <Form.Item label="Media">
                            <Button
                                type="dashed"
                                onClick={() => setIsMediaDrawerOpen(true)}
                            >
                                Select Media ({selectedMediaIds.length}{" "}
                                selected)
                            </Button>
                            {selectedMediaIds.length > 0 && (
                                <p
                                    style={{
                                        marginTop: 8,
                                        color: "#666666",
                                    }}
                                >
                                    Selected Media IDs:{" "}
                                    {selectedMediaIds.join(", ")}
                                </p>
                            )}
                        </Form.Item>
                        <Form.Item style={{ textAlign: "end" }}>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                >
                                    Create
                                </Button>
                                <Button
                                    onClick={() => {
                                        closeModal();
                                        setSearchParams((prev) => {
                                            const params = {};
                                            if (prev.get("page"))
                                                params.page = prev.get("page");
                                            if (prev.get("perPage"))
                                                params.perPage = prev.get("perPage");
                                            return params;
                                        });
                                        form.resetFields();
                                        resetForm();
                                        setSelectedMediaIds([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
                <Drawer
                    title="Select Media"
                    placement="right"
                    width={Math.min(1200, window.innerWidth * 0.9)}
                    onClose={handleCloseMediaDrawer}
                    open={isMediaDrawerOpen}
                    closable
                    closeIcon={
                        <CloseOutlined style={{ color: "#333333" }} />
                    }
                    styles={{
                        header: { borderBottom: "1px solid #E8E8E8" },
                        body: { padding: 24 },
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        {drawerLoading ? (
                            <Spin
                                size="large"
                                tip="Loading media..."
                                style={{
                                    textAlign: "center",
                                    margin: "100px 0",
                                    flex: 1,
                                }}
                            />
                        ) : error ? (
                            <Alert
                                message="Error"
                                description={error}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setError(null)}
                                style={{ marginBottom: 24, padding: 12 }}
                            />
                        ) : !media.data || media.data.length === 0 ? (
                            <Alert
                                message="No Media Available"
                                description="Please upload some media to select."
                                type="info"
                                showIcon
                                style={{
                                    backgroundColor: "#E6F7FF",
                                    border: "1px solid #91D5FF",
                                    padding: 12,
                                }}
                            />
                        ) : (
                            <>
                                <div
                                    style={{
                                        flex: 1,
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        paddingBottom: 64,
                                    }}
                                >
                                    <Row gutter={[16, 16]} justify="start">
                                        {media.data.map((item) => {
                                            const isVideoMedia =
                                                item.type === "video";
                                            const isSelected =
                                                selectedMediaIds.includes(
                                                    item.id
                                                );
                                            const srcUrl =
                                                isVideoMedia &&
                                                item.thumbnail_url
                                                    ? item.thumbnail_url
                                                    : item.url ||
                                                      "https://via.placeholder.com/450?text=Image+Not+Found";
                                            return (
                                                <Col
                                                    span={colSpan}
                                                    key={item.id}
                                                >
                                                    <Card
                                                        hoverable
                                                        style={{
                                                            ...cardStyles,
                                                            border: isSelected
                                                                ? "2px solid #4A90E2"
                                                                : "1px solid #E8E8E8",
                                                            padding:
                                                                isSelected
                                                                    ? "0"
                                                                    : "1px",
                                                        }}
                                                        bodyStyle={{
                                                            padding: 12,
                                                        }}
                                                        cover={
                                                            <div
                                                                style={
                                                                    imageContainerStyles
                                                                }
                                                            >
                                                                <img
                                                                    alt={
                                                                        item.title ||
                                                                        "Media item"
                                                                    }
                                                                    src={
                                                                        failedImages.has(
                                                                            srcUrl
                                                                        )
                                                                            ? "https://via.placeholder.com/450?text=Image+Not+Found"
                                                                            : srcUrl
                                                                    }
                                                                    style={
                                                                        imageStyles
                                                                    }
                                                                    onError={(
                                                                        e
                                                                    ) =>
                                                                        handleImageError(
                                                                            e,
                                                                            item,
                                                                            srcUrl
                                                                        )
                                                                    }
                                                                />
                                                                {isVideoMedia &&
                                                                    item.duration && (
                                                                        <div
                                                                            style={{
                                                                                position:
                                                                                    "absolute",
                                                                                bottom: 8,
                                                                                right: 8,
                                                                                backgroundColor:
                                                                                    "rgba(0, 0, 0, 0.7)",
                                                                                color: "#FFFFFF",
                                                                                padding:
                                                                                    "4px 8px",
                                                                                borderRadius: 4,
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                            }}
                                                                        >
                                                                            {formatDuration(
                                                                                item.duration
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        }
                                                        onClick={() =>
                                                            handleSelectMedia(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        <Meta
                                                            title={
                                                                <span
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        fontSize: 16,
                                                                    }}
                                                                >
                                                                    {item.title ||
                                                                        "Untitled"}
                                                                </span>
                                                            }
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
                                                                    position:
                                                                        "absolute",
                                                                    top: 8,
                                                                    left: 8,
                                                                    borderRadius: 4,
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
                                </div>
                                <div
                                    style={{
                                        position: "sticky",
                                        bottom: 0,
                                        background: "#FFFFFF",
                                        padding: "12px 0",
                                        borderTop: "1px solid #E8E8E8",
                                        textAlign: "end",
                                    }}
                                >
                                    <Space>
                                        <Button
                                            type="primary"
                                            onClick={
                                                handleSaveMediaSelection
                                            }
                                            disabled={drawerLoading}
                                        >
                                            Save
                                        </Button>
                                        <Pagination
                                            current={
                                                mediaPagination.currentPage
                                            }
                                            pageSize={mediaPagination.limit}
                                            total={mediaPagination.total}
                                            onChange={handleMediaPageChange}
                                            showSizeChanger
                                            pageSizeOptions={[
                                                "8",
                                                "16",
                                                "32",
                                            ]}
                                            disabled={drawerLoading}
                                            style={{
                                                borderRadius: 8,
                                                display: "inline-block",
                                                zIndex: 10,
                                            }}
                                        />
                                    </Space>
                                </div>
                            </>
                        )}
                    </div>
                </Drawer>
                <Drawer
                    title={
                        selectedBlogId
                            ? `Edit Blog ID: ${selectedBlogId}`
                            : "Edit Blog"
                    }
                    placement="right"
                    width={Math.min(1200, window.innerWidth * 0.9)}
                    onClose={() => {
                        setIsBlogDetailDrawerOpen(false);
                        setSelectedBlogId(null);
                    }}
                    open={isBlogDetailDrawerOpen}
                    closable
                    closeIcon={
                        <CloseOutlined style={{ color: "#333333" }} />
                    }
                    styles={{
                        header: { borderBottom: "1px solid #E8E8E8" },
                        body: { padding: 0 },
                    }}
                >
                    {selectedBlogId && (
                        <BlogDetail
                            api={api}
                            blogId={selectedBlogId}
                            onClose={() => {
                                setIsBlogDetailDrawerOpen(false);
                                setSelectedBlogId(null);
                            }}
                        />
                    )}
                </Drawer>
                <Drawer
                    title={`Report for Blog ID: ${reportBlogId}`}
                    placement="right"
                    width={Math.min(1200, window.innerWidth * 0.9)}
                    onClose={() => setReportBlogId(null)}
                    open={!!reportBlogId}
                    closable
                    closeIcon={
                        <CloseOutlined style={{ color: "#333333" }} />
                    }
                    styles={{
                        header: { borderBottom: "1px solid #E8E8E8" },
                        body: { padding: 24 },
                    }}
                >
                    {reportBlogId && (
                        <ReportDashboard blogId={reportBlogId} />
                    )}
                </Drawer>
            </section>
        </ConfigProvider>
    );
}

export default React.memo(BlogContent);