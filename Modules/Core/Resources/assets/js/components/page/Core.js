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

function Core() {
    const [collapsed, setCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationPage, setNotificationPage] = useState(1);
    const [notificationPageSize] = useState(5);
    const [totalNotifications, setTotalNotifications] = useState(0);
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
            console.log(`Cookie ${name}:`, decodedValue);
            return decodedValue;
        }
        console.log(`Cookie ${name} not found`);
        return null;
    };

    const userId = getCookie("id");
    const username = getCookie("username");
    const avatarUrl = getCookie("avatar");

    useEffect(() => {
        if (!token || !userId) {
            if (!token) {
                navigate("/auth/login");
            }
            return;
        }

        // Fetch notifications
        const fetchNotifications = async (page = 1) => {
            try {
                const response = await api.get("/api/core/notifications", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page, per_page: notificationPageSize },
                });
                console.log("Fetched notifications (page", page, "):", response.data);
                setNotifications(response.data.data || []);
                setTotalNotifications(response.data.total || 0);
            } catch (error) {
                message.error("Failed to load notifications.");
                console.error("Fetch notifications error:", error);
            }
        };

        fetchNotifications(notificationPage);

        // Initialize Pusher
        Pusher.logToConsole = true;
        const pusher = new Pusher("f630b112e131865a702e", {
            cluster: "ap1",
            encrypted: true,
            wsHost: "ws-ap1.pusher.com",
            disableStats: true,
            enabledTransports: ["ws", "wss"],
        });

        pusher.connection.bind("connected", () => {
            console.log("Pusher connected");
        });

        pusher.connection.bind("error", (err) => {
            console.error("Pusher error:", err);
            message.error("Real-time notifications are temporarily unavailable.");
        });

        pusher.connection.bind("state_change", (states) => {
            console.log("Pusher state change:", states);
            if (states.current === "disconnected") {
                message.warning("Pusher disconnected. Attempting to reconnect...");
            }
        });

        const channel = pusher.subscribe(`notifications.${userId}`);
        channel.bind("App\\Events\\NewCommentNotification", (data) => {
            console.log("New notification received:", data);
            setNotifications((prev) => {
                if (!prev.find((n) => n.id === data.id)) {
                    const newNotifications = [data, ...prev];
                    return newNotifications.slice(0, 10); // Keep max 10
                }
                return prev;
            });
            setTotalNotifications((prev) => prev + 1);
        });

        channel.bind("pusher:subscription_succeeded", () => {
            console.log(`Subscribed to notifications.${userId}`);
        });

        channel.bind("pusher:subscription_error", (err) => {
            console.error("Pusher subscription error:", err);
            message.error("Failed to subscribe to notifications.");
        });

        // Cleanup only when component unmounts or token/userId changes
        return () => {
            console.log("Cleaning up Pusher for notifications.${userId}");
            try {
                pusher.unsubscribe(`notifications.${userId}`);
                pusher.disconnect();
            } catch (err) {
                console.warn("Error during Pusher cleanup:", err);
            }
        };
    }, [token, userId]); // Removed navigate, notificationPageSize from dependencies

    const handleLogout = () => {
        Modal.confirm({
            title: "Are you sure you want to log out?",
            onOk: async () => {
                try {
                    await dispatch(logout());
                    dispatch(clearToken());
                    navigate("/auth/login");
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
            } catch (error) {
                message.error("Failed to mark notification as read.");
            }
        }

        navigate(`/media/${notification.media1_id}`);
    };

    const handleSeeMore = () => {
        const newPage = notificationPage + 1;
        setNotificationPage(newPage);
        api
            .get("/api/core/notifications", {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: newPage, per_page: notificationPageSize },
            })
            .then((response) => {
                console.log("See More notifications (page", newPage, "):", response.data);
                setNotifications((prev) => {
                    const newNotifications = [...prev, ...(response.data.data || [])];
                    return newNotifications.slice(-10); // Keep only the latest 10
                });
                setTotalNotifications(response.data.total || 0);
            })
            .catch((error) => {
                message.error("Failed to load more notifications.");
                console.error("See More error:", error);
            });
    };

    const notificationMenu = (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
        >
            {notifications.length === 0 ? (
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
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                onClick={() => handleNotificationClick(item)}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: item.is_read
                                        ? "#fff"
                                        : "#f0f5ff",
                                    padding: "20px",
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
                    {notifications.length < totalNotifications && (
                        <div
                            style={{
                                padding: "10px",
                                textAlign: "center",
                                borderTop: "1px solid #f0f0f0",
                            }}
                        >
                            <Button type="link" onClick={handleSeeMore}>
                                See More
                            </Button>
                        </div>
                    )}
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
                                    count={
                                        notifications.filter((n) => !n.is_read)
                                            .length
                                    }
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
                                        onNotificationClick={
                                            handleNotificationClick
                                        }
                                    />
                                }
                            />
                            <Route
                                path="*"
                                element={
                                    <div style={{ padding: 24, textAlign: "center" }}>
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