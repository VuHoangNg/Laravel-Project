import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./redux/store";
import Core from "./app";

const appElement = document.getElementById("core");
if (appElement) {
    const root = ReactDOM.createRoot(appElement);
    root.render(
        <Provider store={store}>
            <BrowserRouter basename="/core">
                <Core />
            </BrowserRouter>
        </Provider>
    );
}