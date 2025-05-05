import React from "react";
import { useSelector } from "react-redux";
import {
    Typography,
    Button,
    Alert,
    Spin,
    Row,
    Col,
    Card,
    Pagination,
    Space,
} from "antd";

const { Title } = Typography;

const MainContent = ({
    loading,
    error,
    setError,
    fetchMedia,
    handleOpenCreate,
    handleCardClick,
    page,
    perPage,
    contentWidth,
    handlePageChange,
}) => {
    const media = useSelector(
        (state) =>
            state.media.media || {
                data: [],
                current_page: 1,
                per_page: 12,
                total: 0,
                last_page: 1,
            }
    );

    const getColSpan = () => {
        if (contentWidth >= 1400) return 6;
        if (contentWidth >= 1200) return 8;
        if (contentWidth >= 900) return 12;
        return 24;
    };

    const colSpan = getColSpan();

    return (
        <div
            style={{
                padding: "24px",
                backgroundColor: "#1C2526",
                color: "#fff",
                flex: 1,
                minWidth: 400,
                overflowX: "hidden",
                overflowY: "auto",
                maxHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Title
                level={2}
                style={{
                    color: "#fff",
                    fontWeight: 700,
                    marginBottom: "16px",
                }}
            >
                Media Management
            </Title>
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{
                        marginBottom: 16,
                        backgroundColor: "#2A3637",
                        color: "#fff",
                        border: "none",
                    }}
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
                        <Button
                            onClick={handleOpenCreate}
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                border: "none",
                                color: "#fff",
                                transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.2)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.1)")
                            }
                        >
                            Add Media
                        </Button>
                        <Button
                            onClick={() => fetchMedia(page, perPage)}
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                border: "none",
                                color: "#fff",
                                transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.2)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.1)")
                            }
                        >
                            Refresh
                        </Button>
                    </Space>
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            paddingRight: "8px",
                        }}
                    >
                        {media.data && media.data.length > 0 ? (
                            <>
                                <Row gutter={[16, 16]} style={{ margin: 0 }}>
                                    {media.data.map((record) => (
                                        <Col span={colSpan} key={record.id}>
                                            <Card
                                                bodyStyle={{ padding: 0 }}
                                                style={{
                                                    backgroundColor:
                                                        "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: "16px",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    overflow: "hidden",
                                                    transition:
                                                        "transform 0.2s, box-shadow 0.2s",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    handleCardClick(record)
                                                }
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform =
                                                        "scale(1.02)";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 4px 15px rgba(0, 0, 0, 0.2)";
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
                                                        aspectRatio: "16 / 9",
                                                        backgroundColor: "#000",
                                                        margin: 0,
                                                        padding: 0,
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            record.thumbnail_url ||
                                                            record.url ||
                                                            "https://placehold.co/150x100?text=No+Preview"
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
                                                </div>
                                                <div
                                                    style={{
                                                        padding: "8px",
                                                        color: "#fff",
                                                    }}
                                                >
                                                    <p style={{ margin: 0 }}>
                                                        {record.title}
                                                    </p>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                                <Pagination
                                    style={{
                                        marginTop: "16px",
                                        textAlign: "center",
                                    }}
                                    current={media.current_page}
                                    pageSize={perPage}
                                    total={media.total}
                                    onChange={handlePageChange}
                                    showSizeChanger
                                    pageSizeOptions={["12", "24", "60"]}
                                />
                            </>
                        ) : (
                            <Alert
                                message="No Media Available"
                                description="Upload some media to get started!"
                                type="info"
                                showIcon
                                style={{
                                    backgroundColor: "#2A3637",
                                    color: "#fff",
                                    border: "none",
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MainContent;
