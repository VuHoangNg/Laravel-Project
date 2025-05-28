import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
    Typography,
    Button,
    Alert,
    Row,
    Col,
    Card,
    Pagination,
    Space,
    Skeleton,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
};

const MainContent = ({
    loading,
    error,
    setError,
    fetchMedia,
    handleOpenCreate,
    handleCardClick,
    page,
    perPage = 8,
    contentWidth,
    handlePageChange,
}) => {
    const media = useSelector((state) => ({
        data: (state.media?.media?.data || []).slice(0, perPage),
        current_page: state.media?.media?.current_page || 1,
        per_page: state.media?.media?.per_page || perPage,
        total: state.media?.media?.total || 0,
        last_page: state.media?.media?.last_page || 1,
    }));

    const isMobile = contentWidth < 768;

    const getColSpan = () => {
        if (contentWidth >= 768) return 6; // 4 columns
        if (contentWidth >= 576) return 12; // 2 columns
        return 24; // 1 column
    };
    const [loadingContent, setLoadingContent] = useState(false);
    const colSpan = getColSpan();

    useEffect(() => {
        if (!loading) {
            fetchMedia(page, perPage);
        }
    }, [page, perPage, fetchMedia, loading]);

    const handleRefresh = async () => {
        setLoadingContent(true);
        try {
            await fetchMedia(page, perPage);
        } catch (error) {
            console.error("Error refreshing media:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    return (
        <div
            style={{
                padding: 24,
                backgroundColor: "#FFFFFF",
                color: "#333333",
                flex: 1,
                minWidth: 300,
                minHeight: "100vh",
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
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
                            color: "#333333",
                            fontWeight: 600,
                            fontSize: 24,
                        }}
                    >
                        Media Management
                    </Title>
                </Col>
                <Col>
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleOpenCreate}
                            style={{
                                borderRadius: 6,
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            }}
                            aria-label="Add new media"
                            disabled={loadingContent}
                        >
                            Add Media
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={loadingContent}
                            onClick={handleRefresh}
                            style={{
                                borderRadius: 6,
                                backgroundColor: "#F5F5F5",
                                color: "#333333",
                                border: "1px solid #D9D9D9",
                            }}
                            aria-label="Refresh media"
                        >
                            Refresh
                        </Button>
                    </Space>
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
                    style={{
                        marginBottom: 24,
                        backgroundColor: "#FFF1F0",
                        color: "#333333",
                        border: "1px solid #FFA39E",
                        borderRadius: 8,
                    }}
                />
            )}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingBottom: 64,
                }}
            >
                {loading || loadingContent ? (
                    <Row gutter={[16, 16]} style={{ margin: 0 }}>
                        {Array.from({ length: perPage }).map((_, index) => (
                            <Col span={colSpan} key={index}>
                                <Skeleton
                                    active
                                    avatar={{ shape: "square", size: "large" }}
                                    paragraph={{ rows: 2 }}
                                />
                            </Col>
                        ))}
                    </Row>
                ) : media.data && media.data.length > 0 ? (
                    <Row gutter={[16, 16]} style={{ margin: 0 }}>
                        {media.data.map((record) => (
                            <Col span={colSpan} key={record.id}>
                                <Card
                                    bodyStyle={{ padding: 0 }}
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        borderRadius: 16,
                                        border: "1px solid rgba(98, 98, 124, 0.44)",
                                        overflow: "hidden",
                                        transition:
                                            "transform 0.2s, box-shadow 0.2s",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleCardClick(record)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            handleCardClick(record);
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View media: ${record.title}`}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform =
                                            "scale(1.02)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                            "none";
                                        e.currentTarget.style.boxShadow =
                                            "none";
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                            aspectRatio: "3 / 2",
                                            backgroundColor: "#F5F5F5",
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                        {record.status === 0 ? (
                                            <Skeleton.Image
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                                loading={true}
                                                active={true}
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    record.thumbnail_url ||
                                                    record.url ||
                                                    "https://placehold.co/150x100/F5F5F5/999999?text=No+Preview"
                                                }
                                                alt={record.title}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                                loading="lazy"
                                                onError={() =>
                                                    console.log(
                                                        "Image load error for:",
                                                        record.thumbnail_url ||
                                                            record.url
                                                    )
                                                }
                                            />
                                        )}
                                        {record.type === "video" &&
                                            record.duration &&
                                            record.status === 1 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        bottom: 8,
                                                        right: 8,
                                                        backgroundColor:
                                                            "rgba(0, 0, 0, 0.7)",
                                                        color: "#FFFFFF",
                                                        padding: "4px 8px",
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {formatDuration(
                                                        record.duration
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <div
                                        style={{
                                            padding: 16,
                                            color: "#333333",
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 16,
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {record.title}
                                        </p>
                                        {record.created_at && (
                                            <p
                                                style={{
                                                    margin: "8px 0 0",
                                                    fontSize: 12,
                                                    color: "#666666",
                                                }}
                                            >
                                                Uploaded:{" "}
                                                {new Date(
                                                    record.created_at
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Alert
                        message="No Media Available"
                        description={
                            <span>
                                Upload some media to get started!{" "}
                                <Button
                                    type="link"
                                    onClick={handleOpenCreate}
                                    style={{
                                        padding: 0,
                                        height: "auto",
                                        color: "#1890ff",
                                    }}
                                >
                                    Add Media
                                </Button>
                            </span>
                        }
                        type="info"
                        showIcon
                        style={{
                            backgroundColor: "#E6F7FF",
                            color: "#333333",
                            border: "1px solid #91D5FF",
                            borderRadius: 8,
                            marginTop: 16,
                        }}
                    />
                )}
            </div>
            <div
                style={{
                    position: "sticky",
                    bottom: 0,
                    backgroundColor: "#FFFFFF",
                    padding: "12px 0",
                    borderTop: "1px solid #E8E8E8",
                    textAlign: "center",
                    zIndex: 10,
                }}
            >
                <Pagination
                    current={media.current_page}
                    pageSize={media.per_page}
                    total={media.total}
                    onChange={(newPage, newPageSize) =>
                        handlePageChange(newPage, newPageSize)
                    }
                    showSizeChanger
                    pageSizeOptions={["8", "16", "24"]}
                    style={{
                        borderRadius: 8,
                        display: "inline-block",
                    }}
                    disabled={loading}
                />
            </div>
        </div>
    );
};

export default React.memo(MainContent);
