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
import api from "../../api/api";

const PAGE_SIZE = 20;

const NotificationsList = ({ token, onNotificationClick }) => {
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);

    const fetchNotifications = async (currentPage) => {
        try {
            const response = await api.get("/api/core/notifications", {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: currentPage, per_page: PAGE_SIZE },
            });
            return response.data.data || [];
        } catch (error) {
            message.error("Failed to load notifications.");
            return [];
        }
    };

    useEffect(() => {
        fetchNotifications(page).then((results) => {
            setInitLoading(false);
            setData(results);
            setList(results);
        });
    }, [token]);

    const onLoadMore = () => {
        setLoading(true);
        setList(
            data.concat(
                Array.from({ length: PAGE_SIZE }).map(() => ({ loading: true }))
            )
        );

        const nextPage = page + 1;
        setPage(nextPage);

        fetchNotifications(nextPage).then((results) => {
            const newData = data.concat(results);
            setData(newData);
            setList(newData);
            setLoading(false);
            window.dispatchEvent(new Event("resize"));
        });
    };

    const loadMore =
        !initLoading && !loading ? (
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
            <Typography.Title level={2}>Notifications</Typography.Title>
            {data.length === 0 && !initLoading ? (
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
                    dataSource={list}
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
                                    title={item.message}
                                    description={`By ${
                                        item.triggered_by?.username || "Unknown"
                                    } on ${item.media?.title || "Media"} - ${
                                        item.created_at
                                            ? new Date(
                                                  item.created_at
                                              ).toLocaleString()
                                            : "Unknown time"
                                    }`}
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
