import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { UserProvider, useUserContext } from "./components/context/UserContext";
import {
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Pagination,
    Spin,
    Alert,
    Upload,
    Image,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";

const { Title } = Typography;

const BASE_API_URL = "http://127.0.0.1:8000";

function UserContent({ api }) {
    const dispatch = useDispatch();
    const users = useSelector((state) => {
        return (
            (state.users && state.users.users) || {
                data: [],
                current_page: 1,
                per_page: 10,
                total: 0,
                last_page: 1,
            }
        );
    });
    const {
        createUserContext,
        editingUserContext,
        getUserContext,
        deleteUserContext,
    } = useUserContext();
    const { resetForm, createUser } = createUserContext;
    const { editingUser, updateUser } = editingUserContext;
    const { isModalOpen, openModal, closeModal, fetchUsers } = getUserContext;
    const {
        isDeleteModalOpen,
        userToDelete,
        openDeleteModal,
        closeDeleteModal,
        deleteUser,
    } = deleteUserContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            await fetchUsers(1, 10);
        } catch (err) {
            setError("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (pagination) => {
        setLoading(true);
        fetchUsers(pagination.current, pagination.pageSize).finally(() => {
            setLoading(false);
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);
        try {
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
            if (editingUser) {
                formData.append("_method", "PUT"); // For Laravel API
                await updateUser(editingUser.id, formData);
            } else {
                await createUser(formData);
            }
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
            setFileList([]);
            // No need to fetch users; Redux store is updated in UserContext
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([
                        {
                            name: key,
                            errors: errors[key],
                        },
                    ]);
                });
            } else {
                setError(
                    error.response?.data?.error ||
                        error.message ||
                        "Failed to save user. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setSearchParams({ action: "delete", id });
        openDeleteModal(id);
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await deleteUser(userToDelete);
            closeDeleteModal();
            setSearchParams({});
            // Fetch users to update pagination
            await fetchUsers(users.current_page, users.per_page);
        } catch (error) {
            setError(
                error.response?.data?.error ||
                    error.message ||
                    "Failed to delete user. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        closeDeleteModal();
        setSearchParams({});
    };

    const handleOpenCreate = () => {
        openModal();
        form.setFieldsValue({
            name: "",
            email: "",
            username: "",
            password: "",
            password_confirmation: "",
        });
        resetForm();
        setFileList([]);
        setSearchParams({ action: "create" });
    };

    const handleOpenEdit = (user) => {
        openModal(user);
        form.setFieldsValue({
            name: user.name,
            email: user.email,
            username: user.username,
            password: "",
            password_confirmation: "",
        });
        setFileList(
            user.avatar_url
                ? [
                      {
                          uid: "-1",
                          name: "avatar",
                          status: "done",
                          url: user.avatar_url,
                      },
                  ]
                : []
        );
        setSearchParams({ action: "edit", id: user.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
        setFileList([]);
    };

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList.slice(-1)); // Limit to one file
    };
    const columns = [
        {
            title: "Avatar",
            dataIndex: "avatar_url",
            key: "avatar",
            render: (avatar_url) =>
                avatar_url ? (
                    <Image
                        src={
                            avatar_url.startsWith("http")
                                ? avatar_url
                                : `${BASE_API_URL}${avatar_url}`
                        }
                        alt="Avatar"
                        width={100}
                    />
                ) : (
                    "No Avatar"
                ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "User Name",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleOpenEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button danger onClick={() => handleDelete(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>User Management</Title>
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
            {!loading && (
                <>
                    <Button
                        type="primary"
                        onClick={handleOpenCreate}
                        style={{ marginBottom: 16 }}
                    >
                        Add User
                    </Button>
                    <Table
                        columns={columns}
                        dataSource={users.data || []}
                        rowKey="id"
                        scroll={{ x: "max-content" }}
                        pagination={{
                            current: users.current_page,
                            pageSize: users.per_page,
                            total: users.total,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText:
                                "No users available. Create a new user to get started!",
                        }}
                    />
                </>
            )}
            <Modal
                title={editingUser ? "Edit User" : "Add User"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                            beforeUpload={() => false} // Prevent auto-upload
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
                                required: !editingUser,
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
                        rules={[
                            {
                                required: !editingUser,
                                message: "Please confirm the password",
                            },
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                {editingUser ? "Update" : "Create"}
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
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

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p>Please refresh the page or try again later.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function User({ api }) {
    return (
        <UserProvider api={api}>
            <ErrorBoundary>
                <UserContent api={api} />
            </ErrorBoundary>
        </UserProvider>
    );
}

export default User;
