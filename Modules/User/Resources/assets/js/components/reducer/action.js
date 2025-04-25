// User Action Types
export const SET_USERS = "users/setUsers";
export const ADD_USER = "users/addUser";
export const UPDATE_USER = "users/updateUser";
export const DELETE_USER = "users/deleteUser";

// User Action Creators
export const setUsers = (users) => ({
    type: SET_USERS,
    payload: users,
});

export const addUser = (user) => ({
    type: ADD_USER,
    payload: user,
});

export const updateUser = (user) => ({
    type: UPDATE_USER,
    payload: user,
});

export const deleteUser = (userId) => ({
    type: DELETE_USER,
    payload: userId,
});
