import React from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "antd";
import MediaContent from "./components/mediaContent";
import MediaDetail from "./components/detail";
import { MediaProvider } from "./context/MediaContext";

const { Content } = Layout;

function Media({ api }) {
    return (
        <MediaProvider api={api}>
            <Content>
                <Routes>
                    <Route path="/" element={<MediaContent />} />
                    <Route path="/:id" element={<MediaDetail />} />
                    <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
            </Content>
        </MediaProvider>
    );
}

export default Media;
