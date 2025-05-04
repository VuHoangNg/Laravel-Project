import React from "react";
import { Modal, Form, Input, Button, Space } from "antd";

const { TextArea } = Input;

const EditCommentModal = ({
    editingCommentId,
    setEditingCommentId,
    editCommentForm,
    handleEditCommentSubmit,
}) => {
    return (
        <Modal
            title="Edit Comment"
            open={!!editingCommentId}
            onCancel={() => {
                setEditingCommentId(null);
                editCommentForm.resetFields();
            }}
            footer={null}
        >
            <Form
                form={editCommentForm}
                layout="vertical"
                onFinish={handleEditCommentSubmit}
            >
                <Form.Item
                    name="comment"
                    label="Comment"
                    rules={[
                        { required: true, message: "Please enter a comment" },
                    ]}
                >
                    <TextArea
                        rows={3}
                        placeholder="Edit your comment..."
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "black",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Update
                        </Button>
                        <Button
                            onClick={() => {
                                setEditingCommentId(null);
                                editCommentForm.resetFields();
                            }}
                        >
                            Cancel
                        </Button>
                    </Space>
                </Form.Item>
                </Form>
        </Modal>
    );
};

export default EditCommentModal;