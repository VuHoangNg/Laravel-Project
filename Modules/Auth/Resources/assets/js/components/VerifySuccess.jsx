import React from "react";
import { Card, Button, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

function VerifySuccess() {
    const navigate = useNavigate();

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
            <Card
                style={{
                    maxWidth: "400px",
                    textAlign: "center",
                    padding: "30px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    animation: "fadeIn 0.5s ease-in-out",
                }}
            >
                <CheckCircleOutlined
                    style={{ fontSize: "50px", color: "#4caf50", marginBottom: "10px" }}
                />
                <Title level={2} style={{ color: "#2c3e50" }}>
                    Email Verified!
                </Title>
                <Paragraph>
                    Your email has been successfully verified. You can now log in and access your account.
                </Paragraph>
                <Button
                    type="primary"
                    block
                    size="large"
                    style={{
                        borderRadius: "5px",
                        backgroundColor: "#2c3e50",
                        borderColor: "#2c3e50",
                    }}
                    onClick={() => navigate("/login")}
                >
                    Go to Login
                </Button>
            </Card>
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

export default VerifySuccess;