import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Card,
  Pagination,
  Tag,
  ConfigProvider,
  Modal,
} from "antd";
import { useBlogContext } from "../context/BlogContext";
import { useSelector, useDispatch } from "react-redux";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";
import { CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Meta } = Card;

// Theme configuration from BlogContent
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
    Button: { primaryColor: "#FFFFFF", primaryBg: "#4A90E2", defaultBorderColor: "#E8E8E8", borderRadius: 6 },
    Alert: { colorBgAlert: "#FFF1F0", colorText: "#333333" },
    Pagination: { colorPrimary: "#4A90E2", colorText: "#333333" },
    Drawer: { colorBgElevated: "#FFFFFF", colorText: "#333333" },
  },
};

// Format duration for videos (from BlogContent)
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function BlogDetail({ api }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [mediaPagination, setMediaPagination] = useState({
    currentPage: 1,
    limit: 8,
    total: 0,
  });
  const [form] = Form.useForm();
  const [contentWidth, setContentWidth] = useState(window.innerWidth);
  const [failedImages, setFailedImages] = useState(new Set());
  const loggedErrors = new Set();

  const media = useSelector(
    (state) =>
      state.blogs?.media || {
        data: [],
        current_page: 1,
        per_page: 8,
        total: 0,
        last_page: 1,
      }
  );

  const { createBlogContext, editingBlogContext, deleteBlogContext } = useBlogContext();
  const { resetForm } = createBlogContext;
  const { updateBlog } = editingBlogContext;
  const { deleteBlog } = deleteBlogContext;

  const isMounted = useRef(false);

  // Handle window resize for responsive column spans
  useEffect(() => {
    const handleResize = () => setContentWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchBlog();
    return () => {
      isMounted.current = false;
    };
  }, [id]);

  const fetchBlog = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/blogs/${id}`, {
        params: { fields: "id,title,content,media" },
      });

      if (isMounted.current) {
        setBlog(response.data);
        form.setFieldsValue({
          title: response.data.title,
          content: response.data.content,
        });
        setSelectedMediaIds(
          response.data.media && Array.isArray(response.data.media)
            ? response.data.media.map((m) => m.id)
            : []
        );
      }
    } catch (err) {
      if (isMounted.current) {
        setError("Failed to load blog details. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isMediaDrawerOpen) return;
    isMounted.current = true;
    fetchMediaForDrawer();
    return () => {
      isMounted.current = false;
    };
  }, [mediaPagination.currentPage, mediaPagination.limit, isMediaDrawerOpen]);

  const fetchMediaForDrawer = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/media?perPage=${mediaPagination.limit}&page=${mediaPagination.currentPage}&fields=id,title,url,thumbnail_url,type,duration&blog_id=null`
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
        setError("Failed to fetch media. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleImageError = (e, item, srcUrl) => {
    if (!failedImages.has(srcUrl)) {
      console.error("Image failed to load:", item, "URL:", srcUrl);
      setFailedImages((prev) => new Set(prev).add(srcUrl));
      e.target.src = "/images/placeholder.png";
    }
  };

  const handleSubmitEdit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...values,
        media_ids: selectedMediaIds,
      };
      await updateBlog(id, payload);
      const response = await api.get(`/api/blogs/${id}`, {
        params: { fields: "id,title,content,media" },
      });
      setBlog(response.data);
      form.setFieldsValue({
        title: response.data.title,
        content: response.data.content,
      });
      setSelectedMediaIds(
        response.data.media && Array.isArray(response.data.media)
          ? response.data.media.map((m) => m.id)
          : []
      );
      setIsMediaDrawerOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        form.setFields(
          Object.keys(errors).map((key) => ({
            name: key,
            errors: errors[key],
          }))
        );
      } else {
        setError("Failed to update blog. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteBlog(id);
      setIsDeleteModalOpen(false);
      navigate(`/blog?page=${searchParams.get("page") || "1"}`);
    } catch (err) {
      setError("Failed to delete blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleOpenMediaDrawer = () => {
    setIsMediaDrawerOpen(true);
    setMediaPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleCloseMediaDrawer = () => {
    setIsMediaDrawerOpen(false);
  };

  const handleSelectMedia = (mediaId) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
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
    } catch (err) {
      setError("Failed to load media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const page = searchParams.get("page") || "1";
    navigate(`/blog?page=${page}`);
  };

  // Responsive column span logic from BlogContent
  const getColSpan = () => (contentWidth >= 1400 ? 6 : contentWidth >= 1200 ? 8 : contentWidth >= 900 ? 12 : 24);

  const colSpan = getColSpan();

  return (
    <ConfigProvider theme={theme}>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#FFFFFF" }}>
        <Row justify={"space-between"}>
        <Title level={2} style={{ margin: 0, color: "#333333", fontWeight: 600, fontSize: 24 }}>
          Edit Blog
        </Title>
        <Button onClick={handleBack} style={{ marginBottom: 16 }}>
          Back to Blog List
        </Button>
        </Row>
        {loading && (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <Spin size="large" tip="Loading..." />
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
        {blog && (
          <div>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitEdit}
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #E8E8E8",
              }}
            >
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input placeholder="Enter blog title" />
              </Form.Item>
              <Form.Item
                name="content"
                label="Content"
                rules={[{ required: true, message: "Please enter content" }]}
              >
                <Input.TextArea rows={4} placeholder="Enter blog content" />
              </Form.Item>
              <Form.Item label="Media">
                <Button type="dashed" onClick={handleOpenMediaDrawer}>
                  Select Media ({selectedMediaIds.length} selected)
                </Button>
                {selectedMediaIds.length > 0 && (
                  <p style={{ marginTop: 8, color: "#666666" }}>
                    Selected Media IDs: {selectedMediaIds.join(", ")}
                  </p>
                )}
              </Form.Item>
              <Space style={{ marginBottom: 16 }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save
                </Button>
                <Button danger onClick={handleOpenDelete}>
                  Delete
                </Button>
              </Space>
            </Form>
            {blog.media && Array.isArray(blog.media) && blog.media.length > 0 && (
              <>
                <Title level={4} style={{ marginTop: 24, color: "#333333" }}>
                  Media
                </Title>
                <Row gutter={[16, 16]}>
                  {blog.media.map((item) => {
                    const srcUrl =
                      item.type === "video" && item.thumbnail_url
                        ? item.thumbnail_url
                        : item.url || "/images/placeholder.png";
                    return (
                      <Col span={colSpan} key={item.id}>
                        {item.type === "video" ? (
                          <VideoPlayer
                            src={item.url}
                            style={{
                              height: 200,
                              objectFit: "cover",
                              width: "100%",
                            }}
                          />
                        ) : (
                          <img
                            alt={item.title || "Media item"}
                            src={failedImages.has(srcUrl) ? "/images/placeholder.png" : srcUrl}
                            style={{
                              height: 200,
                              objectFit: "cover",
                              width: "100%",
                              loading: "lazy",
                            }}
                            onError={(e) => handleImageError(e, item, srcUrl)}
                          />
                        )}
                        <p style={{ marginTop: 8, fontWeight: 600 }}>{item.title || "Untitled"}</p>
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </div>
        )}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalOpen}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
          okText="Delete"
          okType="danger"
        >
          <p>Are you sure you want to delete this blog?</p>
        </Modal>
        <Drawer
          title="Select Media"
          placementশ
          placement="right"
          width={Math.min(1200, window.innerWidth * 0.9)}
          onClose={handleCloseMediaDrawer}
          open={isMediaDrawerOpen}
          closable
          closeIcon={<CloseOutlined style={{ color: "#333333" }} />}
          bodyStyle={{ padding: 24 }}
          headerStyle={{ borderBottom: "1px solid #E8E8E8" }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
            {loading ? (
              <Spin size="large" tip="Loading media..." style={{ textAlign: "center", margin: "20px 0", flex: 1 }} />
            ) : error ? (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 24 }}
              />
            ) : !media.data || media.data.length === 0 ? (
              <Alert
                message="No Media Available"
                description="Please upload some media to select."
                type="info"
                showIcon
                style={{ backgroundColor: "#E6F7FF", border: "1px solid #91D5FF" }}
              />
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 64 }}>
                  <Row gutter={[16, 16]} style={{ width: "100%" }}>
                    {media.data.map((item) => {
                      const isVideoMedia = item.type === "video";
                      const isSelected = selectedMediaIds.includes(item.id);
                      const srcUrl =
                        isVideoMedia && item.thumbnail_url
                          ? item.thumbnail_url
                          : item.url || "/images/placeholder.png";
                      return (
                        <Col span={colSpan} key={item.id}>
                          <Card
                            hoverable
                            style={{
                              border: isSelected ? "2px solid #4A90E2" : "1px solid #E8E8E8",
                              maxWidth: "100%",
                            }}
                            cover={
                              <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2" }}>
                                {isVideoMedia ? (
                                  <img
                                    alt={item.title || "Media item"}
                                    src={failedImages.has(srcUrl) ? "/images/placeholder.png" : srcUrl}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                      loading: "lazy",
                                    }}
                                    onError={(e) => handleImageError(e, item, srcUrl)}
                                  />
                                ) : (
                                  <img
                                    alt={item.title || "Media item"}
                                    src={failedImages.has(srcUrl) ? "/images/placeholder.png" : srcUrl}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                      loading: "lazy",
                                    }}
                                    onError={(e) => handleImageError(e, item, srcUrl)}
                                  />
                                )}
                                {isVideoMedia && item.duration && (
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
                            onClick={() => handleSelectMedia(item.id)}
                          >
                            <Meta
                              title={<span style={{ fontWeight: 600, fontSize: 16 }}>{item.title || "Untitled"}</span>}
                              description={isVideoMedia ? "Video" : "Image"}
                            />
                            {isSelected && (
                              <Tag color="blue" style={{ position: "absolute", top: 8, left: 8, borderRadius: 4 }}>
                                Selected
                              </Tag>
                            )}
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
                    onChange={handleMediaPageChange}
                    showSizeChanger
                    pageSizeOptions={["8", "16", "32"]}
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}

export default BlogDetail;