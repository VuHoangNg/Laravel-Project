import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Typography,
    Spin,
    Alert,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Upload,
    Image,
} from "antd";
import { useUserContext } from "../context/UserContext";
import { UploadOutlined } from "@ant-design/icons";

const { Title } = Typography;
const BASE_API_URL = "http://127.0.0.1:8000";

function UserDetail({ api }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    const { getUserContext } = useUserContext();
    const { fetchUser } = getUserContext;

    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        fetchUserData();

        return () => {
            console.log("Cleaning up UserDetail useEffect for ID:", id);
            isMounted.current = false;
        };
    }, []);

    const fetchUserData = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        setError(null);

        try {
            const userData = await fetchUser(id);

            if (isMounted.current) {
                setUser(userData);
                form.setFieldsValue({
                    name: userData.name,
                    email: userData.email,
                    username: userData.username,
                    password: "",
                    password_confirmation: "",
                });

                setFileList(
                    userData.avatar_url
                        ? [
                              {
                                  uid: "-1",
                                  name: "avatar",
                                  status: "done",
                                  url: userData.avatar_url,
                              },
                          ]
                        : []
                );
            }
        } catch (err) {
            if (isMounted.current) {
                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load user details. Please try again."
                );
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const handleSubmitEdit = async (values) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Submitting user update:", values);
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("username", values.username);
            formData.append("email", values.email);
            if (values.password) {
                formData.append("password", values.password);
                formData.append(
                    "password_confirmation",
                    values.password_confirmation
                );
            }
            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append("avatar", fileList[0].originFileObj);
            }
            formData.append("_method", "PUT");

            const response = await api.post(`/api/user/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const userData = await fetchUser(id);
            console.log("Updated user data:", userData);
            setUser(userData);
            form.setFieldsValue({
                name: userData.name,
                email: userData.email,
                username: userData.username,
                password: "",
                password_confirmation: "",
            });
            setFileList(
                userData.avatar_url
                    ? [
                          {
                              uid: "-1",
                              name: "avatar",
                              status: "done",
                              url: userData.avatar_url,
                          },
                      ]
                    : []
            );
        } catch (error) {
            console.error("Error updating user:", error);
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([{ name: key, errors: errors[key] }]);
                });
            } else {
                setError(
                    error.response?.data?.message ||
                        error.message ||
                        "Failed to update user. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Deleting user with ID: ${id}`);
            await api.delete(`/api/user/${id}`);
            setIsDeleteModalOpen(false);
            const page = searchParams.get("page") || "1";
            navigate(`/users?page=${page}`);
        } catch (err) {
            console.error("Error deleting user:", err);
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to delete user. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
    };

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList.slice(-1));
    };

    const handleBack = () => {
        const page = searchParams.get("page") || "1";
        console.log(`Navigating back to /users?page=${page}`);
        navigate(`/users?page=${page}`);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Edit User</Title>
            <Button onClick={handleBack} style={{ marginBottom: 16 }}>
                Back to User List
            </Button>
            {loading && (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <Spin size="large" />
                </div>
            )}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}
            {user && (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitEdit}
                    style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[
                            { required: true, message: "Please enter a name" },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label="User Name"
                        rules={[
                            {
                                required: true,
                                message: "Please enter a user name",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            {
                                required: true,
                                type: "email",
                                message: "Please enter a valid email",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="avatar" label="Avatar">
                        <Upload
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>
                                Upload Avatar
                            </Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                min: 8,
                                message:
                                    "Password must be at least 8 characters",
                            },
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="password_confirmation"
                        label="Confirm Password"
                    >
                        <Input.Password />
                    </Form.Item>
                    <Space style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            Save
                        </Button>
                        <Button danger onClick={handleOpenDelete}>
                            Delete
                        </Button>
                    </Space>
                </Form>
            )}
            <Modal
                title="Confirm Delete"
                open={isDeleteModalOpen}
                onOk={handleConfirmDelete}
                onCancel={handleCancelDelete}
                okText="Delete"
                okType="danger"
            >
                <p>Are you sure you want to delete this user?</p>
            </Modal>
        </div>
    );
}

export default UserDetail;
