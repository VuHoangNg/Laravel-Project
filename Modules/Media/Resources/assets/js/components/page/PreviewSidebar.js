import React, { useRef, useEffect } from "react";
import { Typography, Text, Button } from "antd";
import VideoPlayer from "../../../../../../Core/Resources/assets/js/components/page/VideoPlayer";

const { Title } = Typography;

const PreviewSidebar = ({
    showSplitter,
    siderWidth,
    selectedMedia,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isResizing,
    sidebarRef,
    videoRef,
    handleVideoPause,
    updateContentWidth,
    debouncedUpdateContentWidth,
}) => {
    const splitterRef = useRef(null);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, debouncedUpdateContentWidth]);

    return (
        showSplitter && (
            <div style={{ display: "flex", height: "100vh", flexShrink: 0 }}>
                <div
                    ref={splitterRef}
                    style={{
                        width: "5px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        cursor: "col-resize",
                        height: "100%",
                    }}
                    onMouseDown={handleMouseDown}
                />
                <div
                    ref={sidebarRef}
                    style={{
                        width: `${siderWidth}px`,
                        backgroundColor: "rgba(28, 37, 38, 0.95)",
                        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "16px",
                        position: "relative",
                        backdropFilter: "blur(10px)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        height: "100vh",
                        flexShrink: 0,
                    }}
                >
                    {selectedMedia ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    marginBottom: "16px",
                                    flexShrink: 0,
                                }}
                            >
                                <Title
                                    level={4}
                                    style={{ color: "#fff", margin: 0 }}
                                >
                                    Preview
                                </Title>
                                <Button
                                    style={{
                                        backgroundColor: "#1890ff",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        cursor: "pointer",
                                        marginLeft: "20px",
                                    }}
                                    onClick={() =>
                                        window.location.href = `/core/media/${selectedMedia.id}`
                                    }
                                >
                                    Edit
                                </Button>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    padding: 0,
                                    marginBottom: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        position: "relative",
                                        backgroundColor: "#000",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                    }}
                                >
                                    {selectedMedia.type === "video" ||
                                    selectedMedia.url.includes("video") ? (
                                        <VideoPlayer
                                            ref={videoRef}
                                            src={selectedMedia.url}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                display: "block",
                                            }}
                                            onPause={handleVideoPause}
                                            autoPlay={false}
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={
                                                selectedMedia.thumbnail_url ||
                                                selectedMedia.url ||
                                                "https://placehold.co/150x100?text=No+Preview"
                                            }
                                            alt={selectedMedia.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                display: "block",
                                            }}
                                            loading="lazy"
                                            onError={() =>
                                                console.log(
                                                    "Image load error for:",
                                                    selectedMedia.thumbnail_url ||
                                                        selectedMedia.url
                                                )
                                            }
                                        />
                                    )}
                                </div>
                                <div
                                    style={{
                                        padding: "8px",
                                        color: "#fff",
                                        flexShrink: 0,
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        {selectedMedia.title}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: "12px",
                                            opacity: 0.7,
                                        }}
                                    >
                                        Uploaded on{" "}
                                        {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            <Typography
                                style={{ color: "#fff", fontSize: "16px" }}
                            >
                                No asset selected
                            </Typography>
                        </div>
                    )}
                </div>
            </div>
        )
    );
};

export default PreviewSidebar;
