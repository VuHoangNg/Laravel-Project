import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
} from "./redux/actions";
import {
    Layout,
    Typography,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
} from "antd";
import { useSearchParams } from "react-router-dom";

const { Title } = Typography;
const { Content } = Layout;

function BlogContent({
    createBlogContext,
    editingBlogContext,
    getBlogContext,
    deleteBlogContext,
}) {
    const dispatch = useDispatch();
    const blogs = useSelector((state) => state.blogs.blogs);
    const { resetForm } = createBlogContext;
    const { editingBlog } = editingBlogContext;
    const { isModalOpen, openModal, closeModal } = getBlogContext;
    const { isDeleteModalOpen, blogToDelete, openDeleteModal, closeDeleteModal } =
        deleteBlogContext;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();

    React.useEffect(() => {
        dispatch(fetchBlogs());
    }, [dispatch]);

    const handleSubmit = async (values) => {
        try {
            if (editingBlog) {
                await dispatch(updateBlog(editingBlog.id, values));
            } else {
                await dispatch(createBlog(values));
            }
            closeModal();
            setSearchParams({});
            form.resetFields();
            resetForm();
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
            }
        }
    };

    const handleDelete = (id) => {
        setSearchParams({ action: "delete", id });
        openDeleteModal(id);
    };

    const handleConfirmDelete = () => {
        dispatch(deleteBlog(blogToDelete));
        closeDeleteModal();
        setSearchParams({});
    };

    const handleCancelDelete = () => {
        closeDeleteModal();
        setSearchParams({});
    };

    const handleOpenCreate = () => {
        openModal();
        form.resetFields();
        form.setFieldsValue({ title: "", content: "" });
        resetForm();
        setSearchParams({ action: "create" });
    };

    const handleOpenEdit = (blog) => {
        openModal(blog);
        form.resetFields();
        form.setFieldsValue(blog);
        setSearchParams({ action: "edit", id: blog.id });
    };

    const handleCancel = () => {
        closeModal();
        setSearchParams({});
        form.resetFields();
        resetForm();
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Content",
            dataIndex: "content",
            key: "content",
            render: (text) => text.substring(0, 50) + "...",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button onClick={() => handleOpenEdit(record)}>Edit</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Content style={{ padding: "24px" }}>
            <Title level={2}>Blog Management</Title>
            <Button
                type="primary"
                onClick={handleOpenCreate}
                style={{ marginBottom: 16 }}
            >
                Add Blog
            </Button>
            <Table columns={columns} dataSource={blogs} rowKey="id" />
            <Modal
                title={editingBlog ? "Edit Blog" : "Add Blog"}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            { required: true, message: "Please enter a title" },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Content"
                        rules={[
                            { required: true, message: "Please enter content" },
                        ]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingBlog ? "Update" : "Create"}
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
                <p>Are you sure you want to delete this blog?</p>
            </Modal>
        </Content>
    );
}

function Blog() {
    // State for creating blogs
    const [formData, setFormData] = useState({ title: "", content: "" });

    const createBlogContext = {
        formData,
        setFormData,
        resetForm: () => setFormData({ title: "", content: "" }),
    };

    // State for editing blogs
    const [editingBlog, setEditingBlog] = useState(null);

    const editingBlogContext = {
        editingBlog,
        setEditingBlog,
    };

    // State for getting blogs (modal control)
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getBlogContext = {
        isModalOpen,
        openModal: (blog = null) => {
            setEditingBlog(blog);
            setIsModalOpen(true);
        },
        closeModal: () => {
            setEditingBlog(null);
            setIsModalOpen(false);
        },
    };

    // State for deleting blogs
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);

    const deleteBlogContext = {
        isDeleteModalOpen,
        blogToDelete,
        openDeleteModal: (blogId) => {
            setBlogToDelete(blogId);
            setIsDeleteModalOpen(true);
        },
        closeDeleteModal: () => {
            setBlogToDelete(null);
            setIsDeleteModalOpen(false);
        },
    };

    return (
        <Layout>
            <BlogContent
                createBlogContext={createBlogContext}
                editingBlogContext={editingBlogContext}
                getBlogContext={getBlogContext}
                deleteBlogContext={deleteBlogContext}
            />
        </Layout>
    );
}

export default Blog;