import React, { useState, useEffect } from "react";
import { List, Avatar, Typography, Layout, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import api from "../../api/api";

const NotificationsList = ({ token, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });

    const fetchNotifications = async (page = 1, pageSize = 20) => {
        setLoading(true);
        try {
            const response = await api.get("/api/core/notifications", {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, per_page: pageSize },
            });
            setNotifications(response.data.data || []);
            setPagination({
                current: response.data.current_page,
                pageSize,
                total: response.data.total,
            });
        } catch (error) {
            message.error("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(pagination.current, pagination.pageSize);
    }, [token]);

    const handlePaginationChange = (page, pageSize) => {
        fetchNotifications(page, pageSize);
    };

    return (
        <Layout style={{ padding: 24, background: "#fff" }}>
            <Typography.Title level={2}>Notifications</Typography.Title>
            {notifications.length === 0 && !loading ? (
                <div
                    style={{
                        textAlign: "center",
                        color: "#888",
                        fontSize: "14px",
                        padding: "20px",
                    }}
                >
                    No notifications available
                </div>
            ) : (
                <List
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: handlePaginationChange,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                    }}
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            onClick={() => onNotificationClick(item)}
                            style={{
                                cursor: "pointer",
                                padding: "16px",
                                backgroundColor: item.is_read
                                    ? "#fff"
                                    : "#f0f5ff",
                                marginBottom: "8px",
                                borderRadius: "4px",
                                transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    "#e6e6e6")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                    item.is_read ? "#fff" : "#f0f5ff")
                            }
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        src={
                                            item.triggered_by?.avatar_url ||
                                            undefined
                                        }
                                        icon={
                                            !item.triggered_by?.avatar_url && (
                                                <UserOutlined />
                                            )
                                        }
                                    />
                                }
                                title={item.message}
                                description={`By ${
                                    item.triggered_by?.username || "Unknown"
                                } on ${
                                    item.media?.title || "Media"
                                } - ${new Date(
                                    item.created_at
                                ).toLocaleString()}`}
                            />
                        </List.Item>
                    )}
                />
            )}
        </Layout>
    );
};

export default NotificationsList;