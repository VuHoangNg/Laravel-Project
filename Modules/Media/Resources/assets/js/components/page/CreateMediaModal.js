import React from "react";
import { Modal, Form, Input, Button, Space, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const CreateMediaModal = ({
    isModalOpen,
    handleCancel,
    handleSubmit,
    form,
    loading,
    normFile,
}) => {
    return (
        <Modal
            title="Add Media"
            open={isModalOpen}
            onCancel={handleCancel}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="title"
                    label="Title"
                    rules={[{ required: true, message: "Please enter a title" }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="file"
                    label="File"
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: "Please upload a file" }]}
                >
                    <Upload
                        beforeUpload={() => false}
                        accept="image/*,video/*"
                        maxCount={1}
                    >
                        <Button icon={<UploadOutlined />}>Upload File</Button>
                    </Upload>
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Create
                        </Button>
                        <Button onClick={handleCancel}>Cancel</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateMediaModal;