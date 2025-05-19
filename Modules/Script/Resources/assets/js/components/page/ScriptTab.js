import React, { useEffect, useRef, useState } from "react";
import {
    Table,
    Button,
    Card,
    Modal,
    Form,
    Input,
    Tooltip,
    Drawer,
    message,
    Upload,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    CommentOutlined,
    UploadOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import { useScriptContext } from "../context/ScriptContext";
import { useSelector, useDispatch } from "react-redux";
import FeedBackDrawer from "./FeedBackDrawer";
import { SET_FEEDBACKS } from "../reducer/action";
import { useSearchParams } from "react-router-dom";

// Inline CSS for the highlighted row (you can move this to a separate CSS file)
const highlightStyle = {
    highlightedRow: {
        backgroundColor: "rgba(255, 255, 0, 0.1)", // Light yellow background for highlight
        borderLeft: "4px solid #faad14", // Yellow border for emphasis
    },
};

const ScriptTab = ({ contentHeight, media1_id, scriptId, feedbackId }) => {
    const {
        createScriptContext,
        editingScriptContext,
        getScriptContext,
        deleteScriptContext,
        feedBackContext,
    } = useScriptContext();
    const dispatch = useDispatch();
    const scripts = useSelector((state) => state.scripts.scripts);
    const [form] = Form.useForm();
    const isMounted = useRef(false);
    const [selectedScript, setSelectedScript] = useState(null);
    const [showFeedBackDrawer, setShowFeedBackDrawer] = useState(false);
    const fetchedMediaId = useRef(null);
    const fetchedFeedbackId = useRef(null);
    const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
    const [wasDrawerClosed, setWasDrawerClosed] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    };
    const currentUserId = parseInt(getCookie("id"));

    useEffect(() => {
        isMounted.current = true;
        if (media1_id && fetchedMediaId.current !== media1_id) {
            fetchedMediaId.current = media1_id;
            setIsScriptsLoaded(false);
            getScriptContext
                .fetchScripts(media1_id)
                .then(() => setIsScriptsLoaded(true))
                .catch((err) => {
                    console.error("Failed to fetch scripts:", err);
                    message.error("Failed to fetch scripts");
                    setIsScriptsLoaded(true);
                });
        }
        if (scriptId && isScriptsLoaded && scripts?.data) {
            const script = scripts.data.find(
                (s) => s.id === parseInt(scriptId)
            );
            if (script) {
                setSelectedScript({
                    key: script.id,
                    part: script.part,
                    est_time: script.est_time,
                    direction: script.direction,
                    detail: script.detail,
                    note: script.note,
                });
                setShowFeedBackDrawer(true);
            } else if (!script) {
                setSelectedScript({ key: parseInt(scriptId) });
                setShowFeedBackDrawer(true);
                console.warn(`Script with id ${scriptId} not found`);
            }
        }
        if (feedbackId && fetchedFeedbackId.current !== feedbackId) {
            fetchedFeedbackId.current = feedbackId;
            feedBackContext
                .fetchFeedbackById(feedbackId)
                .then((feedbackData) => {
                    const feedbacks = feedbackData.parent_id
                        ? [
                              {
                                  ...feedbackData,
                                  parent_id: null,
                                  children: feedbackData.children || [],
                              },
                              { ...feedbackData, children: [] },
                          ]
                        : [
                              {
                                  ...feedbackData,
                                  children: feedbackData.children || [],
                              },
                          ];
                    const feedbackTree =
                        feedBackContext.buildFeedbackTree(feedbacks);
                    const targetScriptId =
                        selectedScript?.key || parseInt(scriptId);
                    dispatch({
                        type: SET_FEEDBACKS,
                        payload: {
                            scriptId: targetScriptId,
                            feedbacks: feedbackTree,
                        },
                    });
                    if (!selectedScript)
                        setSelectedScript({ key: parseInt(scriptId) });
                    setShowFeedBackDrawer(true);
                })
                .catch((err) => {
                    console.error("Failed to fetch feedback:", err);
                    message.error("Feedback not found");
                });
        }
        return () => {
            isMounted.current = false;
        };
    }, [media1_id, wasDrawerClosed]);

    const handleCreate = () => {
        getScriptContext.openModal();
        form.resetFields();
        createScriptContext.resetForm();
    };

    const handleEdit = (record) => {
        getScriptContext.openModal(record);
        form.setFieldsValue(record);
    };

    const handleDelete = (id) => {
        deleteScriptContext.openDeleteModal(id);
    };

    const handleFeedback = (record) => {
        setSelectedScript(record);
        setShowFeedBackDrawer(true);
    };

    const handleFormSubmit = async (values) => {
        const payload = { ...values, media1_id };
        try {
            if (editingScriptContext.editingScript) {
                await editingScriptContext.updateScript(
                    editingScriptContext.editingScript.key,
                    payload
                );
            } else {
                await createScriptContext.createScript(payload);
            }
        } catch (error) {
            console.error("Form submit error:", error);
        }
        getScriptContext.closeModal();
        if (isMounted.current) {
            getScriptContext.fetchScripts(media1_id);
            form.resetFields();
        }
    };

    const handleDrawerClose = () => {
        setShowFeedBackDrawer(false);
        setSelectedScript(null);
        setWasDrawerClosed(true);
        setSearchParams(`?id=${media1_id}`);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteScriptContext.deleteScript(
                deleteScriptContext.scriptToDelete,
                media1_id
            );
            deleteScriptContext.closeDeleteModal();
            if (isMounted.current) getScriptContext.fetchScripts(media1_id);
        } catch (error) {
            console.error("Delete confirm error:", error);
        }
    };

    const handleExport = async () => {
        if (!scripts.data || scripts.data.length === 0) {
            message.error("No scripts available to export.");
            return;
        }
        try {
            await getScriptContext.exportScripts(media1_id);
        } catch (error) {
            console.error("Export error:", error);
        }
    };

    const handleImport = async (file) => {
        try {
            const result = await getScriptContext.importScripts(media1_id, file);
            if (result.errors.length > 0) {
                // Errors are already displayed in ScriptProvider, but you can add additional UI here
                console.log(`Imported ${result.successCount} scripts, ${result.errors.length} rows failed.`);
            }
        } catch (error) {
            console.error("Import error:", error);
        }
        return false; // Prevent Ant Design Upload from handling the file
    };

    const dataSource = getScriptContext.isModalOpen
        ? []
        : scripts?.data?.map((script) => ({
              key: script.id,
              part: script.part,
              est_time: script.est_time,
              direction: script.direction,
              detail: script.detail,
              note: script.note,
          })) || [];

    const columns = [
        {
            title: "Part",
            dataIndex: "part",
            key: "part",
            ellipsis: true,
            width: 100,
        },
        {
            title: "Est. Time",
            dataIndex: "est_time",
            key: "est_time",
            ellipsis: true,
            width: 100,
        },
        {
            title: "Direction",
            dataIndex: "direction",
            key: "direction",
            ellipsis: true,
            width: 200,
        },
        {
            title: "Detail",
            dataIndex: "detail",
            key: "detail",
            ellipsis: true,
            width: 300,
        },
        {
            title: "Note",
            dataIndex: "note",
            key: "note",
            ellipsis: true,
            width: 200,
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <>
                    <Button
                        icon={<CommentOutlined />}
                        shape="circle"
                        onClick={() => handleFeedback(record)}
                    />
                    <Button
                        icon={<EditOutlined />}
                        shape="circle"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        shape="circle"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleDelete(record.key)}
                    />
                </>
            ),
            width: 120,
        },
    ];

    // Function to determine the row class for highlighting
    const getRowClassName = (record) => {
        return record.key === parseInt(scriptId) ? "highlighted-row" : "";
    };

    return (
        <div style={{ display: "flex", height: contentHeight, width: "100%" }}>
            <style>
                {`
                    .highlighted-row {
                        background-color: rgba(255, 255, 0, 0.1);
                        border-left: 4px solid #faad14;
                    }
                `}
            </style>
            <Card
                title={null}
                bordered={false}
                style={{
                    height: contentHeight,
                    background: "rgba(28, 37, 38, 0.95)",
                    color: "#e0e0e0",
                    overflowY: "auto",
                    flex: 1,
                }}
                extra={
                    <div>
                        <Upload
                            accept=".xlsx,.csv"
                            showUploadList={false}
                            beforeUpload={handleImport}
                        >
                            <Button
                                icon={<UploadOutlined />}
                                style={{ marginRight: 8 }}
                            >
                                Import
                            </Button>
                        </Upload>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            style={{ marginRight: 8 }}
                        >
                            Export Excel
                        </Button>
                        <Button type="primary" onClick={handleCreate}>
                            Add
                        </Button>
                    </div>
                }
            >
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    scroll={{ y: contentHeight - 80, x: 1020 }}
                    style={{ background: "#1C2526", color: "#e0e0e0" }}
                    rowClassName={getRowClassName} // Apply the highlight class
                />
                <Modal
                    title={
                        editingScriptContext.editingScript
                            ? "Edit Script"
                            : "Create Script"
                    }
                    open={getScriptContext.isModalOpen}
                    onOk={() => form.submit()}
                    onCancel={getScriptContext.closeModal}
                    width={600}
                    style={{ top: 20 }}
                    bodyStyle={{ background: "#ffffff", padding: 24 }}
                >
                    <Form
                        form={form}
                        onFinish={handleFormSubmit}
                        initialValues={createScriptContext.formData}
                        layout="vertical"
                    >
                        <Form.Item
                            name="part"
                            label={
                                <Tooltip title="The section or segment of the script">
                                    <span>Part</span>
                                </Tooltip>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter Part",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter part name"
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="est_time"
                            label={
                                <Tooltip title="Estimated duration (e.g., 00:00:05)">
                                    <span>Estimated Time</span>
                                </Tooltip>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter Est. Time",
                                },
                            ]}
                        >
                            <Input
                                placeholder="e.g., 00:00:05"
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="direction"
                            label={
                                <Tooltip title="Instructions for the scene or action">
                                    <span>Direction</span>
                                </Tooltip>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter Direction",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Enter direction"
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="detail"
                            label={
                                <Tooltip title="Detailed description of the scene">
                                    <span>Detail</span>
                                </Tooltip>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter Detail",
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder="Enter detailed description"
                                autoSize={{ minRows: 3, maxRows: 6 }}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="note"
                            label={
                                <Tooltip title="Additional notes or remarks">
                                    <span>Note</span>
                                </Tooltip>
                            }
                        >
                            <Input.TextArea
                                placeholder="Enter notes (optional)"
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    title="Confirm Delete"
                    open={deleteScriptContext.isDeleteModalOpen}
                    onOk={handleDeleteConfirm}
                    onCancel={deleteScriptContext.closeDeleteModal}
                    width={400}
                    style={{ top: 20 }}
                    bodyStyle={{
                        background: "#ffffff",
                        padding: 24,
                        textAlign: "center",
                    }}
                >
                    <div>Are you sure you want to delete this script?</div>
                </Modal>
            </Card>
            {selectedScript && (
                <Drawer
                    title="Feedback"
                    placement="right"
                    width={600}
                    onClose={handleDrawerClose}
                    open={showFeedBackDrawer}
                    bodyStyle={{
                        background: "rgba(28, 37, 38, 0.95)",
                        color: "#e0e0e0",
                        padding: 16,
                    }}
                >
                    <FeedBackDrawer
                        selectedScript={selectedScript}
                        contentHeight={contentHeight}
                        currentUserId={currentUserId}
                        highlightedFeedbackId={feedbackId}
                    />
                </Drawer>
            )}
        </div>
    );
};

export default ScriptTab;