import React from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "antd";
import { MediaProvider } from "./components/context/MediaContext";
import MediaContent from "./components/page/MediaContent";
import MediaDetail from "./components/action/MediaDetail";


const { Content } = Layout;

function Media({ api }) {
    return (
        <MediaProvider api={api}>
            <Content>
                <Routes>
                    <Route path="/" element={<MediaContent />} />
                    <Route path="/:id" element={<MediaDetail api={api} />} />
                    <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
            </Content>
        </MediaProvider>
    );
}

export default Media;
