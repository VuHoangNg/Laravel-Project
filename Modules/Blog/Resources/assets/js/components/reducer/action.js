// action.js

// Blog Action Types
export const SET_BLOGS = "blogs/setBlogs";
export const ADD_BLOG = "blogs/addBlog";
export const UPDATE_BLOG = "blogs/updateBlog";
export const DELETE_BLOG = "blogs/deleteBlog";

// Blog Action Creators
export const setBlogs = (blogs) => ({
    type: SET_BLOGS,
    payload: blogs,
});

export const addBlog = (blog) => ({
    type: ADD_BLOG,
    payload: blog,
});

export const updateBlog = (blog) => ({
    type: UPDATE_BLOG,
    payload: blog,
});

export const deleteBlog = (blogId) => ({
    type: DELETE_BLOG,
    payload: blogId,
});
