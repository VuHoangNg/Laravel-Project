import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    Navigate,
} from "react-router-dom";
import { Button, Typography, Row, Col, Card } from "antd";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import RootLayout from "./components/Layout";
import VerifySuccess from "./components/VerifySuccess";
import { store } from "../../../../Core/Resources/assets/js/components/reducer/store";

const { Title, Paragraph } = Typography;

function App() {
    return (
        <Provider store={store}>
            <Router basename="/auth">
                <Routes>
                    <Route
                        path="/*"
                        element={
                            <RootLayout>
                                <Routes>
                                    <Route
                                        path="/"
                                        element={
                                            <Row
                                                justify="center"
                                                align="middle"
                                                style={{ minHeight: "100%" }}
                                            >
                                                <Col xs={22} sm={16} md={12} lg={8}>
                                                    <Card
                                                        style={{
                                                            borderRadius: "10px",
                                                            boxShadow:
                                                                "0 4px 20px rgba(0, 0, 0, 0.1)",
                                                            animation:
                                                                "fadeIn 0.5s ease-in-out",
                                                        }}
                                                    >
                                                        <Title
                                                            level={2}
                                                            style={{
                                                                textAlign: "center",
                                                                color: "#2c3e50",
                                                            }}
                                                        >
                                                            Welcome to the V APP
                                                        </Title>
                                                        <Paragraph
                                                            style={{
                                                                textAlign: "center",
                                                                color: "#7f8c8d",
                                                                fontSize: "1.1rem",
                                                                marginBottom: "30px",
                                                            }}
                                                        >
                                                            Securely manage your
                                                            account with ease. Log
                                                            in to access your
                                                            dashboard or sign up to
                                                            get started.
                                                        </Paragraph>
                                                        <Row
                                                            justify="center"
                                                            gutter={16}
                                                        >
                                                            <Col>
                                                                <Link to="/login">
                                                                    <Button
                                                                        type="primary"
                                                                        size="large"
                                                                        style={{
                                                                            borderRadius: "5px",
                                                                            padding: "0 30px",
                                                                        }}
                                                                    >
                                                                        Log In
                                                                    </Button>
                                                                </Link>
                                                            </Col>
                                                            <Col>
                                                                <Link to="/signup">
                                                                    <Button
                                                                        size="large"
                                                                        style={{
                                                                            borderRadius: "5px",
                                                                            padding: "0 30px",
                                                                        }}
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
                                    <Route path="/email-verified" element={<VerifySuccess />} />
                                    <Route
                                        path="*"
                                        element={<div>404 - Page Not Found</div>}
                                    />
                                </Routes>
                            </RootLayout>
                        }
                    />
                </Routes>
            </Router>
        </Provider>
    );
}

const appElement = document.getElementById("app");
if (appElement) {
    const root = ReactDOM.createRoot(appElement);
    root.render(<App />);
}