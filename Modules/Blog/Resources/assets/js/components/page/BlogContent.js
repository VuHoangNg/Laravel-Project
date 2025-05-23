import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Button,
    Modal,
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
    Drawer,
    Carousel,
} from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBlogContext } from "../context/BlogContext";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import ReportDashboard from "./ReportDashboard";

const { Title } = Typography;
const { Meta } = Card;

function BlogContent({ api }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const blogs = useSelector((state) => {
        return (
            state.blogs.blogs || {
                data: [],
                current_page: 1,
                per_page: 12,
                total: 0,
                last_page: 1,
            }
        );
    });
    const media = useSelector(
        (state) =>
            state.blogs.media || {
                data: [],
                current_page: 1,
                per_page: 6,
                total: 0,
                last_page: 1,
            }
    );
    const { createBlogContext, getBlogContext } = useBlogContext();
    const { resetForm, createBlog } = createBlogContext;
    const { isModalOpen, openModal, closeModal, fetchBlogs } = getBlogContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [mediaPagination, setMediaPagination] = useState({
        currentPage: 1,
        limit: 6,
        total: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState(null);

    // Track mounted state
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        loadInitialData();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadInitialData = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);

        try {
            const page =
                parseInt(searchParams.get("page")) || blogs.current_page;
            const perPage =
                parseInt(searchParams.get("perPage")) || blogs.per_page;
            await fetchBlogs(page, perPage);
        } catch (err) {
            if (isMounted.current) {
                setError("Failed to load blogs. Please try again.");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;

        fetchMediaForModal();

        return () => {
            isMounted.current = false;
        };
    }, [mediaPagination.currentPage, mediaPagination.limit, isMediaModalOpen]);

    const fetchMediaForModal = async () => {
        if (!isMounted.current || !isMediaModalOpen) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                `/api/media?perPage=${mediaPagination.limit}&page=${mediaPagination.currentPage}&fields=id,title,url,thumbnail_url,type`
            );
            if (isMounted.current) {
                dispatch(setMedia(response.data));
                setMediaPagination((prev) => ({
                    ...prev,
                    total: response.data.total,
                }));
            }
        } catch (error) {
            if (isMounted.current) {
                console.error("Failed to fetch media:", error);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleTableChange = async (pagination) => {
        setLoading(true);
        setError(null);
        try {
            await fetchBlogs(pagination.current, pagination.pageSize);
            setSearchParams({
                page: pagination.current.toString(),
                perPage: pagination.pageSize.toString(),
            });
        } catch (err) {
            setError("Failed to load blogs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (blog) => {
        navigate(`/blog/${blog.id}?page=${blogs.current_page}`);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...values,
                media_ids: selectedMediaIds,
            };
            await createBlog(payload);
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
            setSelectedMediaIds([]);
            await fetchBlogs(blogs.current_page, blogs.per_page);
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
                setError("Failed to save blog. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        openModal();
        form.setFieldsValue({ title: "", content: "" });
        resetForm();
        setSelectedMediaIds([]);
        setSearchParams({ action: "create" });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
        setSelectedMediaIds([]);
    };

    const handleOpenMediaModal = () => {
        setIsMediaModalOpen(true);
        setMediaPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleCloseMediaModal = () => {
        setIsMediaModalOpen(false);
    };

    const handleSelectMedia = (mediaId) => {
        setSelectedMediaIds((prev) =>
            prev.includes(mediaId)
                ? prev.filter((id) => id !== mediaId)
                : [...prev, mediaId]
        );
    };

    const handleImageError = (e, item) => {
        console.error(
            `Failed to load image for ${item?.title || "unknown"}:`,
            item?.path,
            item?.thumbnail_path
        );
        e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
    };

    const handleMediaPageChange = async (page, pageSize) => {
        setLoading(true);
        setError(null);
        try {
            setMediaPagination((prev) => ({
                ...prev,
                currentPage: page,
                limit: pageSize,
            }));
            setSearchParams({
                mediaPage: page.toString(),
                mediaPerPage: pageSize.toString(),
            });
        } catch (err) {
            setError("Failed to load media. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReportDrawer = (blogId) => {
        setSelectedBlogId(blogId);
        setIsReportDrawerOpen(true);
    };

    const handleCloseReportDrawer = () => {
        setIsReportDrawerOpen(false);
        setSelectedBlogId(null);
    };

    const [activeIndex, setActiveIndex] = useState(0);

    const carouselSettings = {
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        afterChange: (current) => setActiveIndex(current),
        autoplaySpeed: 5000,
        dotPosition: "bottom",
        dots: true,
    };

    return (
        <div className="p-6">
            <Row justify="space-between" align="middle">
                <Title level={2}>Blog Management</Title>
                <Button
                    type="primary"
                    onClick={handleOpenCreate}
                    className="mb-4"
                >
                    Add Blog
                </Button>
            </Row>
            {loading && (
                <div className="text-center my-5">
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
                    className="mb-4"
                />
            )}
            {!loading && (
                <>
                    <Row gutter={[16, 16]}>
                        {blogs.data && blogs.data.length > 0 ? (
                            blogs.data.map((blog) => (
                                <Col xs={24} sm={12} md={6} key={blog.id}>
                                    <Card
                                        hoverable
                                        className="cursor-pointer"
                                        onClick={() => handleRowClick(blog)}
                                        cover={
                                            blog.media &&
                                            blog.media.length > 0 ? (
                                                <div
                                                    style={{
                                                        aspectRatio: "16/9",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Carousel
                                                        autoplay={{
                                                            dotDuration: true,
                                                        }}
                                                        autoplaySpeed={5000}
                                                    >
                                                        {blog.media.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    style={{
                                                                        position:
                                                                            "relative",
                                                                    }}
                                                                >
                                                                    <img
                                                                        alt={
                                                                            item.title
                                                                        }
                                                                        src={
                                                                            item.type ===
                                                                                "video" &&
                                                                            item.thumbnail_path
                                                                                ? `/storage/${item.thumbnail_path}`
                                                                                : item.type ===
                                                                                      "image" ||
                                                                                  !item.type
                                                                                ? `/storage/${item.path}`
                                                                                : "https://via.placeholder.com/150?text=Image+Not+Found"
                                                                        }
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "250px",
                                                                            objectFit:
                                                                                "fill",
                                                                        }}
                                                                        onError={(
                                                                            e
                                                                        ) =>
                                                                            handleImageError(
                                                                                e,
                                                                                item
                                                                            )
                                                                        }
                                                                    />
                                                                    <Tag
                                                                        color={
                                                                            item.type ===
                                                                            "video"
                                                                                ? "red"
                                                                                : item.type ===
                                                                                      "image" ||
                                                                                  !item.type
                                                                                ? "blue"
                                                                                : "gray"
                                                                        }
                                                                        className="absolute top-2 left-2"
                                                                    >
                                                                        {item.type ===
                                                                        "video"
                                                                            ? "Video"
                                                                            : item.type ===
                                                                                  "image" ||
                                                                              !item.type
                                                                            ? "Image"
                                                                            : "Unknown"}
                                                                    </Tag>
                                                                </div>
                                                            )
                                                        )}
                                                    </Carousel>
                                                    <p>
                                                        Active Slide:{" "}
                                                        {activeIndex + 1} of{" "}
                                                        {blog.media.length}
                                                    </p>
                                                </div>
                                            ) : (
                                                <img
                                                    alt="No Media"
                                                    src="https://via.placeholder.com/150?text=No+Media"
                                                    style={{
                                                        aspectRatio: "16/9",
                                                        objectFit: "inherit",
                                                    }}
                                                />
                                            )
                                        }
                                    >
                                        <Meta
                                            title={blog.title}
                                            description={
                                                blog.content
                                                    ? blog.content.substring(
                                                          0,
                                                          50
                                                      ) + "..."
                                                    : ""
                                            }
                                        />
                                        <Button
                                            type="link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenReportDrawer(blog.id);
                                            }}
                                            className="mt-2"
                                        >
                                            View Report
                                        </Button>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Col span={24}>
                                <Alert
                                    message="No Blogs Available"
                                    description="Create a new blog to get started!"
                                    type="info"
                                    showIcon
                                />
                            </Col>
                        )}
                    </Row>
                    <Pagination
                        style={{ marginTop: 16, textAlign: "center" }}
                        current={blogs.current_page}
                        pageSize={blogs.per_page}
                        total={blogs.total}
                        onChange={(page, pageSize) =>
                            handleTableChange({ current: page, pageSize })
                        }
                        showSizeChanger
                        pageSizeOptions={["12", "24", "48"]}
                    />
                </>
            )}
            <Modal
                title="Add Blog"
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
                    <Form.Item label="Media">
                        <Button type="dashed" onClick={handleOpenMediaModal}>
                            Select Media ({selectedMediaIds.length} selected)
                        </Button>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Create
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
                width="90%"
                style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
                {loading ? (
                    <div className="text-center my-5">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError(null)}
                        className="mb-4"
                    />
                ) : !media.data || media.data.length === 0 ? (
                    <Alert
                        message="No Media Available"
                        description="Please upload some media to select."
                        type="info"
                        showIcon
                    />
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            {media.data.map((item) => {
                                const isVideoMedia = item.type === "video";
                                const isSelected = selectedMediaIds.includes(
                                    item.id
                                );

                                return (
                                    <Col span={8} key={item.id}>
                                        <Card
                                            hoverable
                                            style={{
                                                border: isSelected
                                                    ? "2px solid #1890ff"
                                                    : "1px solid #d9d9d9",
                                            }}
                                            cover={
                                                <img
                                                    alt={item.title}
                                                    src={
                                                        item.thumbnail_url ||
                                                        item.url ||
                                                        "https://via.placeholder.com/150?text=Image+Not+Found"
                                                    }
                                                    style={{
                                                        height: 250,
                                                        objectFit: "cover",
                                                    }}
                                                    onError={(e) =>
                                                        handleImageError(
                                                            e,
                                                            item
                                                        )
                                                    }
                                                />
                                            }
                                            onClick={() =>
                                                handleSelectMedia(item.id)
                                            }
                                        >
                                            <Meta
                                                title={item.title}
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
                                                        position: "absolute",
                                                        top: 10,
                                                        left: 10,
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
                        <Pagination
                            style={{ marginTop: 16, textAlign: "center" }}
                            current={mediaPagination.currentPage}
                            pageSize={mediaPagination.limit}
                            total={mediaPagination.total}
                            onChange={handleMediaPageChange}
                            showSizeChanger
                            pageSizeOptions={["6", "12", "24"]}
                        />
                    </>
                )}
            </Modal>
            <Drawer
                title={`Report for Blog ID: ${selectedBlogId}`}
                placement="right"
                width="80%"
                onClose={handleCloseReportDrawer}
                open={isReportDrawerOpen}
            >
                {selectedBlogId && <ReportDashboard blogId={selectedBlogId} />}
            </Drawer>
        </div>
    );
}

export default BlogContent;
