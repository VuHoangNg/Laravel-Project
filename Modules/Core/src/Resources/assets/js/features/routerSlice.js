// src/features/routerSlice.js
import { createSlice } from "@reduxjs/toolkit";

const routerSlice = createSlice({
    name: "router",
    initialState: {
        location: null,
    },
    reducers: {
        setLocation: (state, action) => {
            state.location = action.payload;
        },
    },
});

export const { setLocation } = routerSlice.actions;
export default routerSlice.reducer;
