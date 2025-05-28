import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Typography, Button, Drawer, Form, Input, Space, Card, Row, Col, Pagination, Spin, Alert, Tag,
  Carousel, ConfigProvider, Tooltip, message, Modal
} from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBlogContext } from "../context/BlogContext";
import ReportDashboard from "./ReportDashboard";
import { PlusOutlined, CloseOutlined, EditOutlined, LineChartOutlined } from "@ant-design/icons";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";

const { Title } = Typography;
const { Meta } = Card;

const theme = {
  token: {
    colorPrimary: "#4A90E2",
    colorBgBase: "#FFFFFF",
    colorTextBase: "#333333",
    colorBorder: "#E8E8E8",
    borderRadius: 8,
    fontSize: 16
  },
  components: {
    Card: { borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" },
    Modal: { colorBgElevated: "#FFFFFF", colorText: "#333333" },
    Button: { primaryColor: "#FFFFFF", primaryBg: "#4A90E2", defaultBorderColor: "#E8E8E8", borderRadius: 6 },
    Alert: { colorBgAlert: "#FFF1F0", colorText: "#333333" },
    Carousel: { dotBg: "#E8E8E8", dotActiveBg: "#4A90E2" },
    Pagination: { colorPrimary: "#4A90E2", colorText: "#333333" },
    Drawer: { colorBgElevated: "#FFFFFF", colorText: "#333333" }
  }
};

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function BlogContent({ api }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const blogs = useSelector((state) => state.blogs?.blogs || { data: [], current_page: 1, per_page: 8, total: 0 });
  const media = useSelector((state) => state.blogs?.media || { data: [], current_page: 1, per_page: 8, total: 0 });
  const { createBlogContext: { resetForm, createBlog }, getBlogContext: { isModalOpen, openModal, closeModal, fetchBlogs } } = useBlogContext();
  const [form] = Form.useForm();
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [mediaPagination, setMediaPagination] = useState({ currentPage: 1, limit: 8, total: 0 });
  const [loading, setLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportBlogId, setReportBlogId] = useState(null);
  const [contentWidth, setContentWidth] = useState(window.innerWidth);
  const [failedImages, setFailedImages] = useState(new Set());

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
    setMediaLoading(false);
  };

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const page = parseInt(searchParams.get("page")) || blogs.current_page;
      const perPage = parseInt(searchParams.get("perPage")) || 8;
      await fetchBlogs(page, perPage);
      console.log("Blogs state after fetch:", { data: blogs.data, current_page: blogs.current_page, per_page: blogs.per_page, total: blogs.total });
    } catch (err) {
      handleError(err, "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    setMediaLoading(true);
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
      setMediaLoading(false);
    }
  };

  const handleTableChange = (page, pageSize) => {
    setLoading(true);
    setError(null);
    try {
      setSearchParams({ page: page.toString(), perPage: pageSize.toString() });
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
      await createBlog({ ...values, media_ids: selectedMediaIds });
      message.success("Blog created successfully");
      closeModal();
      setSearchParams({});
      form.resetFields();
      resetForm();
      setSelectedMediaIds([]);
      await fetchBlogs(blogs.current_page, blogs.per_page);
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        form.setFields(Object.keys(errors).map((key) => ({ name: key, errors: errors[key] })));
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
      e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
    }
  };

  const getColSpan = () => contentWidth >= 1400 ? 6 : contentWidth >= 1200 ? 8 : contentWidth >= 900 ? 12 : 24;

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
    accessibility: true
  };

  if (loading) return <Spin size="large" tip="Loading blogs..." style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }} />;

  return (
    <ConfigProvider theme={theme}>
      <section style={{ padding: 24, background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col><Title level={2} style={{ margin: 0, color: "#333333", fontWeight: 600, fontSize: 24 }}>Blog Management</Title></Col>
          <Col>
            <Tooltip title="Create New Blog">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { openModal(); form.resetFields(); resetForm(); setSelectedMediaIds([]); setSearchParams({ action: "create" }); }} aria-label="Create new blog">
                Add Blog
              </Button>
            </Tooltip>
          </Col>
        </Row>
        {error && <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 24 }} action={<Button size="small" onClick={loadBlogs}>Retry</Button>} />}
        <div style={{ flex: 1, overflowY: isScrollable ? "auto" : "hidden", paddingBottom: 64, overflowX: "hidden" }}>
          <Row gutter={[16, 16]}>
            {blogs.data.length ? blogs.data.map((blog) => (
              <Col span={colSpan} key={blog.id}>
                <Card
                  hoverable
                  actions={[
                    <Tooltip title="Edit Blog" key="edit"><EditOutlined onClick={(e) => { e.stopPropagation(); navigate(`/blog/${blog.id}?page=${blogs.current_page}`); }} aria-label="Edit blog" /></Tooltip>,
                    <Tooltip title="View Report" key="analyze"><LineChartOutlined onClick={(e) => { e.stopPropagation(); setReportBlogId(blog.id); }} aria-label="View report" /></Tooltip>
                  ]}
                  cover={
                    blog.media?.length ? (
                      <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                        <Carousel {...carouselSettings}>
                          {blog.media.map((item) => {
                            const srcUrl = item.type === "video" && item.thumbnail_url ? item.thumbnail_url : item.url || "https://via.placeholder.com/150?text=Image+Not+Found";
                            return (
                              <div key={item.id}>
                                <img
                                  alt={item.title || "Blog Media"}
                                  src={failedImages.has(srcUrl) ? "https://via.placeholder.com/150?text=Image+Not+Found" : srcUrl}
                                  style={{ width: "100%", height: 200, objectFit: "cover", loading: "lazy" }}
                                  onError={(e) => handleImageError(e, item, srcUrl)}
                                />
                              </div>
                            );
                          })}
                        </Carousel>
                      </div>
                    ) : (
                      <img alt="No Media" src="https://via.placeholder.com/150?text=No+Media" style={{ aspectRatio: "16/9", objectFit: "cover", height: 200 }} />
                    )
                  }
                >
                  <Meta
                    title={<span style={{ fontWeight: 600, fontSize: 16 }}>{blog.title}</span>}
                    description={blog.content && <span style={{ color: "#666666", fontSize: 14 }}>{blog.content.slice(0, 50) + "..."}</span>}
                  />
                </Card>
              </Col>
            )) : (
              <Col span={24}>
                <Alert
                  message={blogs.current_page === 1 ? "No Blogs Available" : "No More Blogs"}
                  description={blogs.current_page === 1 ? "Create a new blog to get started!" : "There are no more blogs to display on this page."}
                  type="info"
                  showIcon
                  style={{ backgroundColor: "#E6F7FF", border: "1px solid #91D5FF" }}
                  action={blogs.current_page === 1 && (
                    <Button type="primary" size="{SEPARATOR}small" onClick={() => { openModal(); form.resetFields(); resetForm(); setSelectedMediaIds([]); setSearchParams({ action: "create" }); }}>
                      Create Blog
                    </Button>
                  )}
                />
              </Col>
            )}
          </Row>
        </div>
        <div style={{ position: "sticky", bottom: 0, background: "#FFFFFF", padding: "12px 0", borderTop: "1px solid #E8E8E8", textAlign: "center" }}>
          <Pagination
            current={blogs.current_page}
            pageSize={blogs.per_page}
            total={blogs.total}
            onChange={handleTableChange}
            showSizeChanger
            pageSizeOptions={["8", "16", "24"]}
            disabled={loading}
          />
        </div>
        <Modal
          title="Add Blog"
          open={isModalOpen}
          onCancel={() => { closeModal(); setSearchParams({}); form.resetFields(); resetForm(); setSelectedMediaIds([]); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ padding: 16, border: "1px solid #E8E8E8" }}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please enter a title" }]}>
              <Input placeholder="Enter blog title" />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true, message: "Please enter content" }]}>
              <Input.TextArea rows={4} placeholder="Enter blog content" />
            </Form.Item>
            <Form.Item label="Media">
              <Button type="dashed" onClick={() => setIsMediaDrawerOpen(true)}>
                Select Media ({selectedMediaIds.length} selected)
              </Button>
              {selectedMediaIds.length > 0 && <p style={{ marginTop: 8, color: "#666666" }}>Selected Media IDs: {selectedMediaIds.join(", ")}</p>}
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>Create</Button>
                <Button onClick={() => { closeModal(); setSearchParams({}); form.resetFields(); resetForm(); setSelectedMediaIds([]); }}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
        <Drawer
          title="Select Media"
          placement="right"
          width={Math.min(1200, window.innerWidth * 0.9)}
          onClose={() => setIsMediaDrawerOpen(false)}
          open={isMediaDrawerOpen}
          closable
          closeIcon={<CloseOutlined style={{ color: "#333333" }} />}
          bodyStyle={{ padding: 24 }}
          headerStyle={{ borderBottom: "1px solid #E8E8E8" }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
            {mediaLoading ? (
              <Spin size="large" tip="Loading media..." style={{ textAlign: "center", margin: "20px 0", flex: 1 }} />
            ) : error ? (
              <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 24 }} />
            ) : !media.data.length ? (
              <Alert
                message="No Media Available"
                description="Please upload some images or videos to select."
                type="info"
                showIcon
                style={{ backgroundColor: "#E6F7FF", border: "1px solid #91D5FF" }}
              />
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 64 }}>
                  <Row gutter={[16, 16]} style={{ width: "100%" }}>
                    {media.data.map((item) => {
                      const isSelected = selectedMediaIds.includes(item.id);
                      const srcUrl = item.type === "video" && item.thumbnail_url ? item.thumbnail_url : item.url || "https://via.placeholder.com/150?text=Image+Not+Found";
                      return (
                        <Col span={colSpan} key={item.id}>
                          <Card
                            hoverable
                            style={{ border: isSelected ? "2px solid #4A90E2" : "1px solid #E8E8E8", maxWidth: "100%" }}
                            cover={
                              <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2" }}>
                                <img
                                  alt={item.title || "Media item"}
                                  src={failedImages.has(srcUrl) ? "https://via.placeholder.com/150?text=Image+Not+Found" : srcUrl}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", loading: "lazy" }}
                                  onError={(e) => handleImageError(e, item, srcUrl)}
                                />
                                {item.type === "video" && item.duration && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: 8,
                                      right: 8,
                                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                                      color: "#FFFFFF",
                                      padding: "4px 8px",
                                      borderRadius: 4,
                                      fontSize: 12,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatDuration(item.duration)}
                                  </div>
                                )}
                              </div>
                            }
                            onClick={() => setSelectedMediaIds((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])}
                          >
                            <Meta
                              title={
                                <span style={{ fontWeight: 600, fontSize: 16 }}>
                                  {item.title || "Untitled"}
                                </span>
                              }
                            />
                            {isSelected && <Tag color="blue" style={{ position: "absolute", top: 8, left: 8, borderRadius: 4 }}>Selected</Tag>}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
                <div style={{ position: "sticky", bottom: 0, background: "#FFFFFF", padding: "12px 0", borderTop: "1px solid #E8E8E8", textAlign: "center" }}>
                  <Pagination
                    current={mediaPagination.currentPage}
                    pageSize={mediaPagination.limit}
                    total={mediaPagination.total}
                    onChange={(page, pageSize) => setMediaPagination({ ...mediaPagination, currentPage: page, limit: pageSize })}
                    showSizeChanger
                    pageSizeOptions={["8", "16", "32"]}
                    disabled={mediaLoading}
                  />
                </div>
              </>
            )}
          </div>
        </Drawer>
        <Drawer
          title={`Report for Blog ID: ${reportBlogId}`}
          placement="right"
          width={Math.min(1200, window.innerWidth * 0.9)}
          onClose={() => setReportBlogId(null)}
          open={!!reportBlogId}
          closable
          closeIcon={<CloseOutlined style={{ color: "#333333" }} />}
          bodyStyle={{ padding: 24 }}
          headerStyle={{ borderBottom: "1px solid #E8E8E8" }}
        >
          {reportBlogId && <ReportDashboard blogId={reportBlogId} />}
        </Drawer>
      </section>
    </ConfigProvider>
  );
}

export default React.memo(BlogContent);