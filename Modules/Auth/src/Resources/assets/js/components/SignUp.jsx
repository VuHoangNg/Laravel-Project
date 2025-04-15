import React, { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import api from "../../../../../../Core/src/Resources/assets/js/api/api";

const { Title } = Typography;

function SignUp() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await api.post("/api/register", values, {
                skipAuth: true,
            });
            message.success(`Account created successfully, ${response.data.name}!`);
            navigate("/auth/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = () => {
        message.error("Please check the fields and try again!");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                padding: "20px",
            }}
        >
            <div
                style={{
                    maxWidth: "400px",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    padding: "30px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    animation: "fadeIn 0.5s ease-in-out",
                }}
            >
                <Title
                    level={2}
                    style={{ textAlign: "center", color: "#2c3e50", marginBottom: "20px" }}
                >
                    Sign Up
                </Title>
                <Form
                    name="signup-form"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Please input your name!" }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your name"
                            size="large"
                            style={{ borderRadius: "5px" }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="User Name"
                        name="username"
                        rules={[{ required: true, message: "Please input your username!" }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your username"
                            size="large"
                            style={{ borderRadius: "5px" }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Please input your email!" },
                            { type: "email", message: "Please enter a valid email!" },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Enter your email"
                            size="large"
                            style={{ borderRadius: "5px" }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: "Please input your password!" },
                            { min: 8, message: "Password must be at least 8 characters!" },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter your password"
                            size="large"
                            style={{ borderRadius: "5px" }}
                        />
                    </Form.Item>
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <Link to="/auth/login" style={{ color: "#3498db" }}>
                            Already have an account? Log In
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
                                borderRadius: "5px",
                                backgroundColor: "#2c3e50",
                                borderColor: "#2c3e50",
                            }}
                        >
                            Sign Up
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
}

export default SignUp;