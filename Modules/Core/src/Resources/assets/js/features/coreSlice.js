// src/features/coreSlice.js
import { createSlice } from '@reduxjs/toolkit';

const coreSlice = createSlice({
  name: 'core',
  initialState: {
    token: localStorage.getItem('core_token') || null,
    username: null,
    redirectTo: null,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.redirectTo = '/home';
      localStorage.setItem('core_token', action.payload.token);
    },
    signupSuccess: (state, action) => {
      state.redirectTo = '/login';
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.redirectTo = '/login';
      localStorage.removeItem('core_token');
    },
    clearRedirect: (state) => {
      state.redirectTo = null;
    },
  },
});

export const { loginSuccess, signupSuccess, logout, clearRedirect } = coreSlice.actions;
export default coreSlice.reducer;