import React from "react";
import { ScriptProvider } from "./components/context/ScriptContext";
import { Layout } from "antd";
import ScriptTab from "./components/page/ScriptTab";
const { Content } = Layout;

function Script({ api, contentHeight, media1_id, scriptId, feedbackId }) {
    return (
        <ScriptProvider api={api}>
            <Content
                style={{
                    width: "100%",
                    maxWidth: "100%",
                    overflowX: "auto",
                }}
            >
                <ScriptTab
                    api={api}
                    contentHeight={contentHeight}
                    media1_id={media1_id}
                    scriptId={scriptId}
                    feedbackId={feedbackId}
                />
            </Content>
        </ScriptProvider>
    );
}

export default Script;