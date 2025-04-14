import React, { useState, useEffect } from "react";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Modal } from "antd";
import {
    Routes,
    Route,
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearToken } from "./redux/actions";
import Blog from "../../../../../Blog/src/Resources/assets/js/app";
import axios from "axios";

const { Header, Sider, Content } = Layout;

// Axios instance with token interceptor
const api = axios.create({
    baseURL: "", // Replace with backend URL, e.g., "http://localhost:8000"
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            store.dispatch({ type: "auth/clearToken" });
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);

function Core() {
    const [collapsed, setCollapsed] = useState(false);
    const { token } = useSelector((state) => state);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    if (!token) {
        window.location.href = "/auth/login";
        return null;
    }

    const handleLogout = () => {
        Modal.confirm({
            title: "Are you sure you want to log out?",
            onOk: () => {
                dispatch(clearToken());
                window.location.href = "/auth/login";
            },
        });
    };

    const menuItems = [
        {
            key: "1",
            icon: <UserOutlined />,
            label: <Link to="/blog">Blog</Link>,
        },
        {
            key: "2",
            icon: <VideoCameraOutlined />,
            label: <Link to="/media">Media</Link>,
        },
        {
            key: "3",
            icon: <UploadOutlined />,
            label: <Link to="/nav3">Navigation 3</Link>,
        },
        {
            key: "4",
            icon: <LogoutOutlined />,
            label: "Logout",
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={["1"]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Button
                        type="text"
                        icon={
                            collapsed ? (
                                <MenuUnfoldOutlined />
                            ) : (
                                <MenuFoldOutlined />
                            )
                        }
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: "16px", width: 64, height: 64 }}
                    />
                </Header>
                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Routes>
                        <Route path="/" element={<h2>Welcome to Core</h2>} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/media" element={<div>Media Page</div>} />
                        <Route path="/nav3" element={<div>Navigation 3 Page</div>} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

export default Core;