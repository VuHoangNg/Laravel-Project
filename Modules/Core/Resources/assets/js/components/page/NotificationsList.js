import React, { useState, useEffect } from "react";
import {
    List,
    Avatar,
    Button,
    Skeleton,
    Layout,
    message,
    Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";


const PAGE_SIZE = 20;

const NotificationsList = ({
    token,
    userId,
    notifications,
    totalNotifications,
    unreadCount,
    onNotificationClick,
    fetchNotifications,
    setNotifications,
    setTotalNotifications,
    setUnreadCount,
}) => {
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (notifications.length > 0 || page > 1) {
            setInitLoading(false);
            return;
        }

        fetchNotifications(page).then(({ data, total, unreadCount }) => {
            setNotifications(data);
            setTotalNotifications(total);
            setUnreadCount(unreadCount);
            setInitLoading(false);
        });
    }, [token, userId, page, fetchNotifications, setNotifications, setTotalNotifications, setUnreadCount]);

    const onLoadMore = () => {
        setLoading(true);
        setNotifications((prev) =>
            prev.concat(
                Array.from({ length: PAGE_SIZE }).map(() => ({ loading: true }))
            )
        );

        const nextPage = page + 1;
        setPage(nextPage);

        fetchNotifications(nextPage).then(({ data, total, unreadCount }) => {
            const newNotifications = notifications
                .filter((n) => !n.loading)
                .concat(data);
            setNotifications(newNotifications);
            setTotalNotifications(total);
            setUnreadCount(unreadCount);
            setLoading(false);
            window.dispatchEvent(new Event("resize"));
        });
    };

    const loadMore =
        !initLoading &&
        !loading &&
        notifications.length < totalNotifications ? (
            <div
                style={{
                    textAlign: "center",
                    marginTop: 12,
                    height: 32,
                    lineHeight: "32px",
                }}
            >
                <Button onClick={onLoadMore}>Load More</Button>
            </div>
        ) : null;

    return (
        <Layout style={{ padding: 24, background: "#fff" }}>
            <Typography.Title level={2}>
                Notifications ({unreadCount} unread)
            </Typography.Title>
            {notifications.length === 0 && !initLoading ? (
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
                    className="demo-loadmore-list"
                    loading={initLoading}
                    itemLayout="horizontal"
                    loadMore={loadMore}
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            onClick={() =>
                                !item.loading && onNotificationClick(item)
                            }
                            style={{
                                cursor: item.loading ? "default" : "pointer",
                                padding: "16px",
                                backgroundColor: item.is_read
                                    ? "#fff"
                                    : "#f0f5ff",
                                marginBottom: "8px",
                                borderRadius: "4px",
                                transition: "background-color 0.3s",
                            }}
                            onMouseEnter={(e) =>
                                !item.loading &&
                                (e.currentTarget.style.backgroundColor =
                                    "#e6e6e6")
                            }
                            onMouseLeave={(e) =>
                                !item.loading &&
                                (e.currentTarget.style.backgroundColor =
                                    item.is_read ? "#fff" : "#f0f5ff")
                            }
                        >
                            <Skeleton
                                avatar
                                title={false}
                                loading={item.loading}
                                active
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            src={
                                                item.triggered_by?.avatar_url ||
                                                undefined
                                            }
                                            icon={
                                                !item.triggered_by
                                                    ?.avatar_url && (
                                                    <UserOutlined />
                                                )
                                            }
                                        />
                                    }
                                    title={
                                        <>
                                            {item.type === 'feedback_reply' ? '🗣️ ' : item.type === 'script_feedback' ? '📝 ' : '💬 '}
                                            {item.message}
                                        </>
                                    }
                                    description={
                                        <>
                                            By {item.triggered_by?.username || "Unknown"} on{" "}
                                            {item.type === 'feedback_reply' || item.type === 'script_feedback'
                                                ? item.script?.title || `Media ID ${item.script?.media1_id || "Unknown"}`
                                                : item.media?.title || "Media"}{" "}
                                            -{" "}
                                            {item.created_at
                                                ? new Date(item.created_at).toLocaleString()
                                                : "Unknown time"}
                                        </>
                                    }
                                />
                            </Skeleton>
                        </List.Item>
                    )}
                />
            )}
        </Layout>
    );
};

export default NotificationsList;