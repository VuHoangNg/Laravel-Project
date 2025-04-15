import React, { useState } from "react";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Modal } from "antd";
import { Routes, Route, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearToken } from "./redux/actions"; // Core auth actions
import api from "./api/api";
import Blog from "../../../../../Blog/src/Resources/assets/js/app";

const { Header, Sider, Content } = Layout;

function Core() {
    const [collapsed, setCollapsed] = useState(false);
    const { token } = useSelector((state) => state.auth); // Updated state path
    const dispatch = useDispatch();
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
            onOk: async () => {
                try {
                    await api.post("/api/logout");
                    dispatch(clearToken());
                    window.location.href = "/auth/login";
                } catch (error) {
                    message.error("Logout failed. Please try again.");
                    console.error(error);
                }
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
                        <Route
                            path="/nav3"
                            element={<div>Navigation 3 Page</div>}
                        />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

export default Core;
