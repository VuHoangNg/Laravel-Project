import React, { useState } from 'react';
import axios from 'axios';
import { Form, Input, Button, message, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const api = axios.create({
    baseURL: '',
});

function Login() {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/api/login', values, {
                headers: { 'Accept': 'application/json' },
            });
            message.success(`Welcome, ${response.data.username}!`);
        } catch (error) {
            if (error.response) {
                message.error(error.response.data.message || 'Login failed');
            } else {
                message.error('An error occurred while logging in.');
            }
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
        message.error('Please check the fields and try again!');
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                padding: '20px',
            }}
        >
            <div
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    padding: '30px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    animation: 'fadeIn 0.5s ease-in-out',
                }}
            >
                <Title level={2} style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
                    Login
                </Title>
                <Form
                    name="login-form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your username"
                            size="large"
                            style={{ borderRadius: '5px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter your password"
                            size="large"
                            style={{ borderRadius: '5px' }}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <Link to="/forgot-password" style={{ color: '#3498db' }}>
                            Forgot Password?
                        </Link>
                        <Link to="/auth/signup" style={{ color: '#3498db' }}>
                            Don't have an account? Sign Up
                        </Link>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={loading}
                            style={{
                                borderRadius: '5px',
                                backgroundColor: '#2c3e50',
                                borderColor: '#2c3e50',
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#34495e')}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#2c3e50')}
                        >
                            Log In
                        </Button>
                    </Form.Item>
                </Form>
            </div>

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
        </div>
    );
}

export default Login;