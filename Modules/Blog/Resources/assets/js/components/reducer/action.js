export const addBlog = (blog) => ({
    type: "blogs/addBlog",
    payload: blog,
});

export const updateBlog = (blog) => ({
    type: "blogs/updateBlog",
    payload: blog,
});

export const setBlogs = (blogs) => ({
    type: "blogs/setBlogs",
    payload: {
        data: blogs.data || [],
        total: blogs.total || 0,
        current_page: blogs.current_page || 1,
        per_page: blogs.per_page || 10,
        last_page: blogs.last_page || 1,
    },
});

export const deleteBlog = (blogId) => ({
    type: "blogs/deleteBlog",
    payload: blogId,
});