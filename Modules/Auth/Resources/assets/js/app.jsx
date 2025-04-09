import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/LogIn';
import SignUp from './components/signup';

// Import Ant Design components
import { Layout, Menu, Button, Typography, Row, Col, Card } from 'antd';
import 'antd/dist/reset.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

function App() {
    const menuItems = [
        {
            key: 'login',
            label: <Link to="/login" aria-label="Navigate to login page">Login</Link>,
        },
        {
            key: 'signup',
            label: <Link to="/signup" aria-label="Navigate to sign up page">Sign Up</Link>,
        },
    ];

    return (
        <Router basename="/auth">
            <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                {/* Header */}
                <Header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000,
                        backgroundColor: '#2c3e50',
                        padding: '0 30px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={3} style={{ color: '#ecf0f1', margin: 0 }}>
                                V APP
                            </Title>
                        </Col>
                        <Col>
                            <Menu
                                theme="dark"
                                mode="horizontal"
                                items={menuItems}
                                style={{
                                    backgroundColor: 'transparent',
                                    borderBottom: 'none',
                                    color: '#ecf0f1',
                                }}
                            />
                        </Col>
                    </Row>
                </Header>

                {/* Main Content */}
                <Content style={{ padding: '40px 20px', flex: 1 }}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Row justify="center" align="middle" style={{ minHeight: '100%' }}>
                                    <Col xs={22} sm={16} md={12} lg={8}>
                                        <Card
                                            style={{
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                animation: 'fadeIn 0.5s ease-in-out',
                                            }}
                                        >
                                            <Title level={2} style={{ textAlign: 'center', color: '#2c3e50' }}>
                                                Welcome to the Auth Module
                                            </Title>
                                            <Paragraph
                                                style={{
                                                    textAlign: 'center',
                                                    color: '#7f8c8d',
                                                    fontSize: '1.1rem',
                                                    marginBottom: '30px',
                                                }}
                                            >
                                                Securely manage your account with ease. Log in to access your dashboard or sign up to get started.
                                            </Paragraph>
                                            <Row justify="center" gutter={16}>
                                                <Col>
                                                    <Link to="/login">
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            style={{ borderRadius: '5px', padding: '0 30px' }}
                                                        >
                                                            Log In
                                                        </Button>
                                                    </Link>
                                                </Col>
                                                <Col>
                                                    <Link to="/signup">
                                                        <Button
                                                            size="large"
                                                            style={{ borderRadius: '5px', padding: '0 30px' }}
                                                        >
                                                            Sign Up
                                                        </Button>
                                                    </Link>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>
                                </Row>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                    </Routes>
                </Content>

                {/* Footer */}
                <Footer
                    style={{
                        textAlign: 'center',
                        backgroundColor: '#2c3e50',
                        color: '#ecf0f1',
                        borderTop: '1px solid #34495e',
                        padding: '15px 30px',
                    }}
                >
                    © {new Date().getFullYear()} Auth Module. All rights reserved.
                </Footer>
            </Layout>

            {/* Add keyframes for fade-in animation */}
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
        </Router>
    );
}

const appElement = document.getElementById('app');
if (appElement) {
    const root = ReactDOM.createRoot(appElement);
    root.render(<App />);
}