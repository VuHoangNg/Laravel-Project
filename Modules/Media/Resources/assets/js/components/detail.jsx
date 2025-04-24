import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Layout, Alert, Button, Card, Descriptions, Spin } from "antd";
import VideoPlayer from "../../../../../Core/Resources/assets/js/components/videoPlayer";
import { useMediaContext } from "./context/MediaContext";

const { Content } = Layout;

const MediaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { api } = useMediaContext();
    const mediaFromStore = useSelector(
        (state) => state.media.media?.data || []
    );
    const [mediaItem, setMediaItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extract page from URL query params, fallback to localStorage or 1
    const fromPage =
        parseInt(searchParams.get("page")) ||
        parseInt(localStorage.getItem("lastMediaPage")) ||
        1;

    console.log("MediaDetail - fromPage:", fromPage);

    useEffect(() => {
        fetchMediaItem();
    }, [id, api, mediaFromStore]);

    const fetchMediaItem = async () => {
        setLoading(true);
        const itemFromStore = mediaFromStore.find(
            (item) => item.id === parseInt(id)
        );
        if (itemFromStore) {
            setMediaItem(itemFromStore);
            setLoading(false);
            return;
        }

        try {
            const response = await api.get(`/api/media/${id}`);
            setMediaItem(response.data);
        } catch (err) {
            setError(
                err.response?.data?.error || "Failed to load media details."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Content
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "24px",
                }}
            >
                <Spin size="large" />
            </Content>
        );
    }

    if (error || !mediaItem) {
        return (
            <Content
                style={{ padding: "24px", maxWidth: "800px", margin: "auto" }}
            >
                <Alert
                    message="Error"
                    description={error || "Media not found."}
                    type="error"
                    showIcon
                />
                <Button
                    type="primary"
                    onClick={() => {
                        console.log("Navigating back with page:", fromPage);
                        navigate(`/media?page=${fromPage}`);
                    }}
                    style={{ marginTop: 16, width: "100%" }}
                >
                    Back to Media List
                </Button>
            </Content>
        );
    }

    const isVideo =
        mediaItem.url.includes("/storage/media/videos/") &&
        mediaItem.url.endsWith(".m3u8");

    return (
        <Content
            style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
            }}
        >
            <Button
                type="primary"
                onClick={() => {
                    console.log("Navigating back with page:", fromPage);
                    navigate(`/media?page=${fromPage}`);
                }}
                style={{ marginBottom: 16 }}
            >
                Back to Media List
            </Button>
            <Card
                title={mediaItem.title}
                style={{
                    width: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Title">
                        {mediaItem.title}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                        {isVideo ? "Video" : "Image"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Preview">
                        {isVideo ? (
                            <VideoPlayer
                                src={mediaItem.url}
                                style={{
                                    width: "100%",
                                }}
                            />
                        ) : (
                            <img
                                src={mediaItem.thumbnail_url || mediaItem.url}
                                alt={mediaItem.title}
                                style={{
                                    width: "100%",
                                    maxHeight: "500px",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                }}
                            />
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </Content>
    );
};

export default MediaDetail;