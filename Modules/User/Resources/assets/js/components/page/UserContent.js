import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Spin,
    Alert,
    Upload,
    Image,
} from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import { useUserContext } from "../context/UserContext";

const { Title } = Typography;
const BASE_API_URL = "http://127.0.0.1:8000";

function UserContent({ api }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const users = useSelector(
        (state) =>
            state.users?.users || {
                data: [],
                current_page: 1,
                per_page: 10,
                total: 0,
                last_page: 1,
            }
    );

    const { createUserContext, getUserContext } = useUserContext();

    const { resetForm, createUser } = createUserContext;
    const { isModalOpen, openModal, closeModal, fetchUsers } = getUserContext;

    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileList, setFileList] = useState([]);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true; // Track if component is mounted

        const loadUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log(`Loading users: page=${page}, perPage=${perPage}`);
                await fetchUsers(page, perPage, {
                    signal: abortController.signal,
                });
            } catch (err) {
                if (err.name === "AbortError") {
                    console.log("User fetch aborted");
                    return;
                }
                if (isMounted) {
                    setError("Failed to load users. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadUsers();

        // Cleanup: Abort the fetch request and mark component as unmounted
        return () => {
            console.log("Cleaning up UserContent useEffect");
            abortController.abort();
            isMounted = false;
        };
    }, [page, perPage, fetchUsers]);

    const handleTableChange = (pagination) => {
        const newPage = pagination.current;
        const newPerPage = pagination.pageSize;
        setSearchParams({
            page: newPage.toString(),
            per_page: newPerPage.toString(),
        });
    };

    const handleRowClick = (user) => {
        navigate(`/users/${user.id}?page=${users.current_page}`);
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

            await createUser(formData);

            closeModal();
            setSearchParams({ page: page.toString() });
            form.resetFields();
            resetForm();
            setFileList([]);
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setFields([{ name: key, errors: errors[key] }]);
                });
            } else {
                setError(
                    error.response?.data?.error ||
                        error.message ||
                        "Failed to save user."
                );
            }
        } finally {
            setLoading(false);
        }
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
        setSearchParams({ action: "create", page: page.toString() });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({ page: page.toString() });
        form.resetFields();
        resetForm();
        setFileList([]);
    };

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList.slice(-1));
    };

    const columns = [
        {
            title: "Avatar",
            dataIndex: "avatar_url",
            key: "avatar",
            render: (url) =>
                url ? (
                    <Image
                        src={
                            url.startsWith("http")
                                ? url
                                : `${BASE_API_URL}${url}`
                        }
                        alt="Avatar"
                        width={100}
                    />
                ) : (
                    "No Avatar"
                ),
        },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
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
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: "pointer" },
                        })}
                        locale={{
                            emptyText:
                                "No users available. Create a new user to get started!",
                        }}
                    />
                </>
            )}

            {/* Create Modal */}
            <Modal
                title="Add User"
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
                                required: true,
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
                                required: true,
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
                                Create
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default UserContent;
