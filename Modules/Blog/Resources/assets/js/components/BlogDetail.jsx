import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Spin, Alert, Row, Col } from "antd";
import VideoPlayer from "../../../../../Core/Resources/assets/js/components/videoPlayer";

const { Title, Paragraph } = Typography;

function BlogDetail({ api }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlog = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/api/blogs/${id}`);
                setBlog(response.data);
            } catch (err) {
                setError("Failed to load blog details. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [api, id]);

    const isVideo = (url) => {
        return (
            typeof url === "string" &&
            url.includes("/storage/media/videos/") &&
            url.endsWith(".m3u8")
        );
    };

    const handleImageError = (e, item) => {
        console.error(
            `Failed to load image for ${item?.title || "unknown"}:`,
            item?.url,
            item?.thumbnail
        );
        e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
    };

    return (
        <div style={{ padding: "24px" }}>
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
            {blog && (
                <div>
                    <Title level={2}>Title: {blog.title}</Title>
                    <Paragraph>Content: {blog.content}</Paragraph>
                    {blog.media && blog.media.length > 0 && (
                        <>
                            <Title level={4}>Media</Title>
                            <Row gutter={[16, 16]}>
                                {blog.media.map((item) => (
                                    <Col span={8} key={item.id}>
                                        {isVideo(item.url) ? (
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
                                                alt={item.title}
                                                src={
                                                    item.thumbnail_url ||
                                                    item.url ||
                                                    "https://via.placeholder.com/150?text=Image+Not+Found"
                                                }
                                                style={{
                                                    height: 200,
                                                    objectFit: "cover",
                                                    width: "100%",
                                                }}
                                                onError={(e) =>
                                                    handleImageError(e, item)
                                                }
                                            />
                                        )}
                                        <p>{item.title}</p>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default BlogDetail;