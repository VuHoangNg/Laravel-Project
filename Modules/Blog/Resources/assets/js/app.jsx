import React from "react";
import { BlogProvider } from "./components/context/BlogContext";
import { Routes, Route } from "react-router-dom";
import { Layout } from "antd";
import BlogContent from "./components/BlogContent";
import BlogDetail from "./components/BlogDetail"; // New component
const { Content } = Layout;

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p>Please refresh the page or try again later.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function Blog({ api }) {
    return (
        <BlogProvider api={api}>
            <ErrorBoundary>
                <Content>
                    <Routes>
                        <Route path="/" element={<BlogContent api={api} />} />
                        <Route path="/:id" element={<BlogDetail api={api} />} />
                    </Routes>
                </Content>
            </ErrorBoundary>
        </BlogProvider>
    );
}

export default Blog;
