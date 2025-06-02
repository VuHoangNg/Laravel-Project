import React, { useState, useEffect, useRef } from "react";
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
  Splitter,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { useBlogContext } from "../context/BlogContext";
import { setMedia } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
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
    Pagination: { colorPrimary: "#4A90E2", colorText: "#333333" },
    Drawer: { colorBgElevated: "#FFFFFF", colorText: "#333333" },
  },
};

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Consistent card styles for both Splitter and Drawer
const cardStyles = {
  maxWidth: 450,
  width: "100%",
  border: "1px solid #E8E8E8",
  borderRadius: 8,
  overflow: "hidden",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

// Consistent image container styles
const imageContainerStyles = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  overflow: "hidden",
};

// Consistent image styles
const imageStyles = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  loading: "lazy",
};

function BlogDetail({ api, blogId, onClose }) {
  const dispatch = useDispatch();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [newlySelectedMediaIds, setNewlySelectedMediaIds] = useState([]); // New state for drawer selections
  const [mediaPagination, setMediaPagination] = useState({
    currentPage: 1,
    limit: 8,
    total: 0,
  });
  const [form] = Form.useForm();
  const [contentWidth, setContentWidth] = useState(window.innerWidth);
  const [failedImages, setFailedImages] = useState(new Set());

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

  const { editingBlogContext, deleteBlogContext } = useBlogContext();
  const { updateBlog } = editingBlogContext;
  const { deleteBlog } = deleteBlogContext;

  const isMounted = useRef(false);

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
  }, [blogId]);

  const fetchBlog = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/blogs/${blogId}`, {
        params: { fields: "id,title,content,media" },
      });

      if (isMounted.current) {
        setBlog(response.data);
        form.setFieldsValue({
          title: response.data.title,
          content: response.data.content,
        });
        const blogMediaIds = response.data.media && Array.isArray(response.data.media)
          ? response.data.media.map((m) => m.id)
          : [];
        setSelectedMediaIds(blogMediaIds);
        setNewlySelectedMediaIds([]); // Initialize empty for new selections
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
    setDrawerLoading(true);
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
        setDrawerLoading(false);
      }
    }
  };

  const handleImageError = (e, item, srcUrl) => {
    if (!failedImages.has(srcUrl)) {
      console.error("Image failed to load:", item, "URL:", srcUrl);
      setFailedImages((prev) => new Set(prev).add(srcUrl));
      e.target.src = "https://via.placeholder.com/450?text=Image+Not+Found";
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
      await updateBlog(blogId, payload);
      const response = await api.get(`/api/blogs/${blogId}`, {
        params: { fields: "id,title,content,media" },
      });
      setBlog(response.data);
      form.setFieldsValue({
        title: response.data.title,
        content: response.data.content,
      });
      const blogMediaIds = response.data.media && Array.isArray(response.data.media)
        ? response.data.media.map((m) => m.id)
        : [];
      setSelectedMediaIds(blogMediaIds);
      setNewlySelectedMediaIds([]); // Reset new selections after save
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

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteBlog(blogId);
      setIsDeleteModalOpen(false);
      onClose();
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
    setNewlySelectedMediaIds([]); // Reset new selections when closing drawer
  };

  const handleSaveMediaSelection = () => {
    setIsMediaDrawerOpen(false);
    // Selected media IDs are already in selectedMediaIds, no additional action needed
  };

  const handleSelectMedia = (mediaId) => {
    const blogMediaIds = blog?.media?.map((m) => m.id) || [];
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
    setNewlySelectedMediaIds((prev) => {
      // Only include mediaId in newlySelectedMediaIds if it's not in blog.media
      if (blogMediaIds.includes(mediaId)) {
        return prev; // Don't add or remove if it's an existing blog media
      }
      return prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId];
    });
  };

  const handleMediaPageChange = async (page, pageSize) => {
    setDrawerLoading(true);
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
      setDrawerLoading(false);
    }
  };

  // Column span for Drawer (media selection)
  const getColSpan = () => {
    if (contentWidth >= 1400) return 6; // 4 cards per row
    if (contentWidth >= 992) return 8; // 3 cards per row
    if (contentWidth >= 768) return 12; // 2 cards per row
    return 24; // 1 card per row
  };

  // Column span for Selected Media in Splitter (fixed to 2 cards per row)
  const getSelectedMediaColSpan = () => {
    return 12; // Always 2 cards per row (24 / 2 = 12)
  };

  const colSpan = getColSpan();
  const selectedMediaColSpan = getSelectedMediaColSpan();

  return (
    <ConfigProvider theme={theme}>
      <div style={{ height: "100%", background: "#FFFFFF" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Spin size="large" tip="Loading..." />
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
                style={{ marginBottom: 16, padding: 12 }}
              />
            )}
            {blog && (
              <Splitter style={{ height: "100%" }}>
                {/* Left Panel: Selected Media */}
                <Splitter.Panel defaultSize="60%" min="30%" max="70%" style={{ overflowY: "auto" }}>
                  <div style={{ padding: 24 }}>
                    <Title level={4} style={{ color: "#333333", marginBottom: 24 }}>
                      Selected Media
                    </Title>
                    {blog.media && blog.media.length > 0 ? (
                      <Row gutter={[24, 24]} justify="start">
                        {blog.media.map((item) => {
                          const isVideoMedia = item.type === "video";
                          const srcUrl =
                            isVideoMedia && item.thumbnail_url
                              ? item.thumbnail_url
                              : item.url || "https://via.placeholder.com/450?text=Image+Not+Found";
                          return (
                            <Col span={selectedMediaColSpan} key={item.id}>
                              <Card
                                hoverable
                                style={{
                                  ...cardStyles,
                                  border: "1px solid #E8E8E8",
                                }}
                                bodyStyle={{ padding: 16 }}
                                cover={
                                  <div style={imageContainerStyles}>
                                    <img
                                      alt={item.title || "Media item"}
                                      src={failedImages.has(srcUrl) ? "https://via.placeholder.com/450?text=Image+Not+Found" : srcUrl}
                                      style={imageStyles}
                                      onError={(e) => handleImageError(e, item, srcUrl)}
                                    />
                                    {isVideoMedia && item.duration && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: 12,
                                          right: 12,
                                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                                          color: "#FFFFFF",
                                          padding: "6px 10px",
                                          borderRadius: 4,
                                          fontSize: 14,
                                          fontWeight: 500,
                                        }}
                                      >
                                        {formatDuration(item.duration)}
                                      </div>
                                    )}
                                  </div>
                                }
                              >
                                <Meta
                                  title={<span style={{ fontWeight: 600, fontSize: 18 }}>{item.title || "Untitled"}</span>}
                                  description={<span style={{ fontSize: 16 }}>{isVideoMedia ? "Video" : "Image"}</span>}
                                />
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <Alert
                        message="No Media Selected"
                        description="Select media using the button on the right panel."
                        type="info"
                        showIcon
                        style={{ backgroundColor: "#E6F7FF", border: "1px solid #91D5FF", padding: 12 }}
                      />
                    )}
                  </div>
                </Splitter.Panel>
                {/* Right Panel: Blog Details and Form */}
                <Splitter.Panel style={{ overflowY: "auto" }}>
                  <div style={{ padding: 24 }}>
                    <Title level={4} style={{ color: "#333333", marginBottom: 24 }}>
                      Blog Details
                    </Title>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmitEdit}
                      style={{ maxWidth: 600 , textAlign:"end"}}
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
                          Select Media ({newlySelectedMediaIds.length} selected)
                        </Button>
                      </Form.Item>
                      <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          Save
                        </Button>
                        <Button danger onClick={() => setIsDeleteModalOpen(true)}>
                          Delete
                        </Button>
                      </Space>
                    </Form>
                  </div>
                </Splitter.Panel>
              </Splitter>
            )}
          </>
        )}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalOpen}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
          okText="Delete"
          okType="danger"
          style={{ padding: 12 }}
        >
          <p>Are you sure you want to delete this blog?</p>
        </Modal>
        <Drawer
          title="Select Media"
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
            {drawerLoading ? (
              <Spin size="large" tip="Loading media..." style={{ textAlign: "center", margin: "100px 0", flex: 1 }} />
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
                style={{ backgroundColor: "#E6F7FF", border: "1px solid #91D5FF", padding: 12 }}
              />
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 64 }}>
                  <Row gutter={[16, 16]} justify="start">
                    {media.data.map((item) => {
                      const isVideoMedia = item.type === "video";
                      const isSelected = selectedMediaIds.includes(item.id);
                      const srcUrl =
                        isVideoMedia && item.thumbnail_url
                          ? item.thumbnail_url
                          : item.url || "https://via.placeholder.com/450?text=Image+Not+Found";
                      return (
                        <Col span={colSpan} key={item.id}>
                          <Card
                            hoverable
                            style={{
                              ...cardStyles,
                              border: isSelected ? "2px solid #4A90E2" : "1px solid #E8E8E8",
                            }}
                            bodyStyle={{ padding: 12 }}
                            cover={
                              <div style={imageContainerStyles}>
                                <img
                                  alt={item.title || "Media item"}
                                  src={failedImages.has(srcUrl) ? "https://via.placeholder.com/450?text=Image+Not+Found" : srcUrl}
                                  style={imageStyles}
                                  onError={(e) => handleImageError(e, item, srcUrl)}
                                />
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
              </>
            )}
            <div style={{ position: "sticky", bottom: 0, background: "#FFFFFF", padding: "12px 0", borderTop: "1px solid #E8E8E8", textAlign: "end" }}>
              <Space>
                <Button type="primary" onClick={handleSaveMediaSelection} disabled={drawerLoading}>
                  Save
                </Button>
                <Pagination
                  current={mediaPagination.currentPage}
                  pageSize={mediaPagination.limit}
                  total={mediaPagination.total}
                  onChange={handleMediaPageChange}
                  showSizeChanger
                  pageSizeOptions={["8", "16", "32"]}
                  disabled={drawerLoading}
                  style={{
                    borderRadius: 8,
                    display: "inline-block",
                    zIndex: 10,
                  }}
                />
              </Space>
            </div>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}

export default BlogDetail;