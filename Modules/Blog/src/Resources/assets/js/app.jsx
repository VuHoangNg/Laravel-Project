import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "../../../../../Auth/src/Resources/assets/js/components/Layout";
import HomeBlog from "./components/Home";

function Blog() {
    return (
        <Router basename="/blog">
            <Routes>
                <Route
                    path="/*"
                    element={
                        <RootLayout>
                            <Routes>
                                <Route path="/" element={<HomeBlog />} />
                            </Routes>
                        </RootLayout>
                    }
                />
            </Routes>
        </Router>
    );
}

const appElement = document.getElementById("blog");
if (appElement) {
    const root = ReactDOM.createRoot(appElement);
    root.render(<Blog />);
}
