import React, { useState, useEffect, Component } from "react";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
    LogoutOutlined,
    ContainerOutlined,
    HomeOutlined,
    BellOutlined,
} from "@ant-design/icons";
import {
    Button,
    Layout,
    Menu,
    theme,
    Modal,
    Badge,
    Dropdown,
    List,
    Avatar,
    message,
    Typography,
    Skeleton,
} from "antd";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearToken } from "../reducer/actions";
import api from "../../api/api";
import Blog from "../../../../../../Blog/Resources/assets/js/app";
import User from "../../../../../../User/Resources/assets/js";
import Media from "../../../../../../Media/Resources/assets/js";
import { logout } from "../../../../../../Auth/Resources/assets/js/components/reducer/actions";
import Pusher from "pusher-js";
import NotificationsList from "./NotificationsList";

// Error Boundary Component
class CoreErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error in Core component:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p>
                        {this.state.error?.message ||
                            "Please try refreshing the page."}
                    </p>
                    <Button
                        type="primary"
                        onClick={() => window.location.reload()}
                    >
                        Refresh
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

const { Header, Sider, Content } = Layout;

const PAGE_SIZE = 5;

function Core() {
    const [collapsed, setCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationPage, setNotificationPage] = useState(1);
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [totalNotifications, setTotalNotifications] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(";").shift();
            const decodedValue = decodeURIComponent(cookieValue);
            return decodedValue;
        }
        return null;
    };

    const userId = getCookie("id");
    const username = getCookie("username");
    const avatarUrl = getCookie("avatar");

    const fetchNotifications = async (page) => {
        try {
            const response = await api.get("/api/core/notifications", {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, per_page: PAGE_SIZE },
            });
            return {
                data: response.data.data || [],
                total: response.data.total || 0,
                unreadCount: response.data.unread_count || 0,
            };
        } catch (error) {
            message.error("Failed to load notifications.");
            return { data: [], total: 0, unreadCount: 0 };
        }
    };

    useEffect(() => {
        if (!token || !userId) {
            if (!token) {
                window.location.href = "/auth/login";
            }
            return;
        }

        fetchNotifications(notificationPage).then(({ data, total, unreadCount }) => {
            setInitLoading(false);
            setNotifications(data);
            setTotalNotifications(total);
            setUnreadCount(unreadCount);
        });

        Pusher.logToConsole = true;
        const pusher = new Pusher("f630b112e131865a702e", {
            cluster: "ap1",
            encrypted: true,
            wsHost: "ws-ap1.pusher.com",
            disableStats: true,
            enabledTransports: ["ws", "wss"],
        });

        const channel = pusher.subscribe(`notifications.${userId}`);
        channel.bind("App\\Events\\NewCommentNotification", (data) => {
            setNotifications((prev) => {
                if (!prev.find((n) => n.id === data.id)) {
                    return [data, ...prev];
                }
                return prev;
            });
            setTotalNotifications((prev) => prev + 1);
            if (!data.is_read) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            try {
                pusher.unsubscribe(`notifications.${userId}`);
                pusher.disconnect();
            } catch (err) {
                console.warn("Error during Pusher cleanup:", err);
            }
        };
    }, []);

    const handleLogout = () => {
        Modal.confirm({
            title: "Are you sure you want to log out?",
            onOk: async () => {
                try {
                    await dispatch(logout());
                    dispatch(clearToken());
                    window.location.href = "/auth/login";
                } catch (error) {
                    message.error("Logout failed. Please try again.");
                }
            },
        });
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            try {
                await api.put(
                    `/api/core/notifications/${notification.id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notification.id ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (error) {
                message.error("Failed to mark notification as read.");
            }
        }
    
        navigate(`/media?id=${notification.media1_id}&comment=${notification.comment_id}`);
    };

    const onLoadMore = () => {
        setLoading(true);
        setNotifications((prev) =>
            prev.concat(
                Array.from({ length: PAGE_SIZE }).map(() => ({ loading: true }))
            )
        );

        const newPage = notificationPage + 1;
        setNotificationPage(newPage);

        fetchNotifications(newPage).then(({ data, total, unreadCount }) => {
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
                    padding: "10px",
                    textAlign: "center",
                    borderTop: "1px solid #f0f0f0",
                }}
            >
                <Button onClick={onLoadMore}>Load More</Button>
            </div>
        ) : null;

    const notificationMenu = (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
        >
            {notifications.length === 0 && !initLoading ? (
                <div
                    style={{
                        padding: "20px",
                        textAlign: "center",
                        backgroundColor: "#fff",
                        color: "#888",
                        fontSize: "14px",
                    }}
                >
                    No notifications available
                </div>
            ) : (
                <>
                    <List
                        style={{
                            width: 400,
                            maxHeight: 800,
                            overflowY: "auto",
                        }}
                        itemLayout="horizontal"
                        loadMore={loadMore}
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                onClick={() =>
                                    !item.loading &&
                                    handleNotificationClick(item)
                                }
                                style={{
                                    cursor: item.loading
                                        ? "default"
                                        : "pointer",
                                    backgroundColor: item.is_read
                                        ? "#fff"
                                        : "#f0f5ff",
                                    padding: "20px",
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
                                                    item.triggered_by
                                                        ?.avatar_url ||
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
                                            item.triggered_by?.username ||
                                            "Unknown"
                                        } on ${
                                            item.media?.title || "Media"
                                        } - ${
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
                </>
            )}
        </div>
    );

    const menuItems = [
        {
            key: "1",
            icon: <HomeOutlined />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: "2",
            icon: <ContainerOutlined />,
            label: <Link to="/blog">Blog</Link>,
        },
        {
            key: "3",
            icon: <VideoCameraOutlined />,
            label: <Link to="/media">Media</Link>,
        },
        {
            key: "4",
            icon: <UserOutlined />,
            label: <Link to="/users">Users</Link>,
        },
    ];

    return (
        <CoreErrorBoundary>
            <Layout style={{ minHeight: "100vh" }}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                >
                    <div className="demo-logo-vertical" />
                    <Menu theme="dark" mode="inline" items={menuItems} />
                </Sider>
                <Layout>
                    <Header
                        style={{
                            padding: "0 24px",
                            background: "#fff",
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "20px",
                            }}
                        >
                            <Dropdown
                                overlay={notificationMenu}
                                trigger={["click"]}
                            >
                                <Badge
                                    count={unreadCount}
                                    offset={[-5, 5]}
                                >
                                    <Button
                                        type="text"
                                        icon={<BellOutlined />}
                                        style={{
                                            color: "black",
                                            fontSize: "24px",
                                        }}
                                    />
                                </Badge>
                            </Dropdown>

                            <Dropdown
                                overlay={
                                    <Menu>
                                        <Menu.Item key="profile">
                                            <Link to={`/users/${userId}`}>
                                                Profile
                                            </Link>
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item
                                            key="logout"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Menu.Item>
                                    </Menu>
                                }
                                trigger={["click"]}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Avatar
                                        size="large"
                                        src={avatarUrl || undefined}
                                        style={{
                                            backgroundColor: "#87d068",
                                            marginRight: 8,
                                            verticalAlign: "middle",
                                        }}
                                    >
                                        {!avatarUrl &&
                                            username?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <span
                                        style={{
                                            color: "black",
                                            fontWeight: 500,
                                            fontSize: 20,
                                        }}
                                    >
                                        {username || "User"}
                                    </span>
                                </div>
                            </Dropdown>
                        </div>
                    </Header>

                    <Content
                        style={{
                            margin: "10px 10px 0 10px",
                            minHeight: 280,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Layout>
                                        <Typography>Home Page</Typography>
                                    </Layout>
                                }
                            />
                            <Route
                                path="/blog/*"
                                element={<Blog api={api} />}
                            />
                            <Route
                                path="/media/*"
                                element={<Media api={api} />}
                            />
                            <Route
                                path="/users/*"
                                element={<User api={api} />}
                            />
                            <Route
                                path="/core/notifications"
                                element={
                                    <NotificationsList
                                        token={token}
                                        userId={userId}
                                        notifications={notifications}
                                        totalNotifications={totalNotifications}
                                        unreadCount={unreadCount}
                                        onNotificationClick={
                                            handleNotificationClick
                                        }
                                        fetchNotifications={fetchNotifications}
                                        setNotifications={setNotifications}
                                        setTotalNotifications={
                                            setTotalNotifications
                                        }
                                        setUnreadCount={setUnreadCount}
                                    />
                                }
                            />
                            <Route
                                path="*"
                                element={
                                    <div
                                        style={{
                                            padding: 24,
                                            textAlign: "center",
                                        }}
                                    >
                                        <Typography.Title level={3}>
                                            Page Not Found
                                        </Typography.Title>
                                        <Button
                                            type="primary"
                                            onClick={() => navigate("/")}
                                        >
                                            Go to Home
                                        </Button>
                                    </div>
                                }
                            />
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </CoreErrorBoundary>
    );
}

export default Core;