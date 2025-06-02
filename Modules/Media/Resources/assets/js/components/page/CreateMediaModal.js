import React from "react";
import { Modal, Form, Input, Button, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

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
      footer={[
        <Button key="submit" type="primary" htmlType="submit" loading={loading} style={{ borderRadius: 4 }} onClick={() => form.submit()}>
          Create
        </Button>,
        <Button key="cancel" onClick={handleCancel} style={{ borderRadius: 4 }}>
          Cancel
        </Button>,
      ]}
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
          <Dragger
            name="file"
            multiple={false}
            beforeUpload={() => false} // Prevent auto-upload
            accept="image/*,video/*"
            maxCount={1}
            style={{
              background: "#FFFFFF",
              border: "2px dashed #000000",
              borderRadius: 8,
              padding: 20,
              textAlign: "center",
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text" style={{ color: "#000000", fontSize: 16 }}>
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint" style={{ color: "#666666", fontSize: 12 }}>
              Support for a single upload. Strictly prohibited from uploading company data or other banned files.
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateMediaModal;