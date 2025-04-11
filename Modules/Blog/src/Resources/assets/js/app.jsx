import React from "react";
import ReactDOM from "react-dom/client";
import { Typography } from "antd";
import Grid from "antd/es/card/Grid";

function Blog() {
    return (
        <Grid>
            <Typography.Title level={2}>Blog</Typography.Title>
            <Typography.Paragraph>
                This is the Blog module.
            </Typography.Paragraph>
        </Grid>
    );
}

const appElement = document.getElementById("blog");
if (appElement) {
    const root = ReactDOM.createRoot(appElement);
    root.render(<Blog />);
}
