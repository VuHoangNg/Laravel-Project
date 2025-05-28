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
                backgroundColor: "#1C2526",
                padding: "8px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 2,
                height: formHeight,
                width: "100%",
            }}
        >
            <Typography.Text style={{fontSize:"16px" , color:"#fff"}}>{`Comment at ${Math.floor(videoTime / 60)
                .toString()
                .padStart(2, "0")}:${Math.floor(videoTime % 60)
                .toString()
                .padStart(2, "0")}`}</Typography.Text>
            <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 2 }}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 4,
                    padding: "8px 40px 8px 8px",
                    resize: "none",
                    flex: 1,
                }}
            />
            <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
            />
        </div>
    );
};

export default CommentInput;
