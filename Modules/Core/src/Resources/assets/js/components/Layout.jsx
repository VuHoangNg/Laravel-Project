// src/components/RootLayout.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Typography, Row, Col } from "antd";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function RootLayout({ children }) {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("core_token");
  const showAuthMenu = !isAuthenticated && !location.pathname.includes("/home");

  const menuItems = [
    {
      key: "login",
      label: (
        <Link to="/login" aria-label="Navigate to login page">
          Login
        </Link>
      ),
    },
    {
      key: "signup",
      label: (
        <Link to="/signup" aria-label="Navigate to sign up page">
          Sign Up
        </Link>
      ),
    },
  ];

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        display: 'flex', // Ensure flex layout for proper footer positioning
        flexDirection: 'column', // Stack children vertically
      }}
    >
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#2c3e50",
          padding: "0 30px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title
              level={3}
              style={{ color: "#ecf0f1", marginTop: "15px" }}
            >
              V APP
            </Title>
          </Col>
          {showAuthMenu && (
            <Col>
              <Menu
                theme="dark"
                mode="horizontal"
                items={menuItems}
                style={{
                  backgroundColor: "transparent",
                  borderBottom: "none",
                  color: "#ecf0f1",
                }}
              />
            </Col>
          )}
        </Row>
      </Header>

      <Content style={{ padding: "40px 20px", flex: 1 }}>
        {children}
      </Content>

      <Footer
        style={{
          textAlign: "center",
          backgroundColor: "#2c3e50",
          color: "#ecf0f1",
          borderTop: "1px solid #34495e",
          padding: "15px 30px",
        }}
      >
        © {new Date().getFullYear()} V APP. All rights reserved.
      </Footer>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Layout>
  );
}

export default RootLayout;