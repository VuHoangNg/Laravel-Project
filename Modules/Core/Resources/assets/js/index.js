import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./components/reducer/store";
import Core from "./components/page/core";


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