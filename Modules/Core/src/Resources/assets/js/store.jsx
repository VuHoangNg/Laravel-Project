// src/store.jsx
import { configureStore } from "@reduxjs/toolkit";
import routerReducer from "./features/routerSlice"; // Ensure this path is correct
import coreReducer from "./features/coreSlice"; // Ensure this path is correct

export const store = configureStore({
    reducer: {
        router: routerReducer,
        core: coreReducer,
    },
});
