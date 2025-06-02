import React, { useState } from "react";
import { Input, Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const CommentInput = ({ onSubmit, videoTime, formHeight }) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            onSubmit({ comment: message });
            setMessage("");
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#FFFFFF",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #E0E0E0",
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: formHeight, // Use minHeight to ensure it doesn't shrink too much
                width: "100%",
                boxSizing: "border-box",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                position: "sticky",
                bottom: 0, // Stick to the bottom of the parent
                zIndex: 1,
            }}
        >
            <Typography.Text
                style={{
                    fontSize: "14px",
                    color: "black",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                }}
            >
                {`Comment at ${Math.floor(videoTime / 60)
                    .toString()
                    .padStart(2, "0")}:${Math.floor(videoTime % 60)
                    .toString()
                    .padStart(2, "0")}`}
            </Typography.Text>
            <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 2 }}
                style={{
                    backgroundColor: "#F9F9F9",
                    color: "black",
                    border: "1px solid #E0E0E0",
                    borderRadius: 4,
                    padding: "8px",
                    resize: "none",
                    flex: 1,
                    fontSize: "14px",
                }}
            />
            <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                style={{
                    backgroundColor: "#1890ff",
                    borderColor: "#1890ff",
                    borderRadius: 4,
                    padding: "0 16px",
                    height: 36,
                }}
            />
        </div>
    );
};

export default CommentInput;