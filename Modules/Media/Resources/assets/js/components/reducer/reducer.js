import {
    SET_MEDIA,
    ADD_MEDIA,
    UPDATE_MEDIA,
    DELETE_MEDIA,
    SET_COMMENTS,
    APPEND_COMMENTS,
    ADD_COMMENT,
    UPDATE_COMMENT,
    DELETE_COMMENT,
} from "../reducer/action";

const initialState = {
    media: {
        data: [],
        current_page: 1,
        per_page: 12,
        total: 0,
        last_page: 1,
    },
    comments: {},
};

const flattenComments = (comments) => {
    const flat = [];
    const flatten = (commentList) => {
        commentList.forEach((comment) => {
            const { children, replies, ...rest } = comment;
            flat.push({ ...rest, children: [] });
            if (children && children.length > 0) flatten(children);
            if (replies && replies.length > 0) flatten(replies);
        });
    };
    flatten(comments);
    return flat;
};

const buildCommentTree = (comments) => {
    const commentMap = new Map();
    const tree = [];

    comments.forEach((comment) => {
        comment.children = comment.children || [];
        commentMap.set(comment.id, comment);
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach((reply) => {
                reply.children = reply.children || [];
                commentMap.set(reply.id, reply);
            });
        }
    });

    comments.forEach((comment) => {
        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.children.push(comment);
            } else {
                tree.push(comment);
            }
        } else {
            tree.push(comment);
        }
        if (comment.replies && comment.replies.length > 0) {
            comment.children.push(...comment.replies);
            comment.replies = [];
        }
    });

    const sortComments = (commentList) => {
        commentList.sort(
            (a, b) =>
                new Date(b.created_at || new Date()) -
                new Date(a.created_at || new Date())
        );
        commentList.forEach((comment) => {
            if (comment.children && comment.children.length > 0) {
                sortComments(comment.children);
            }
        });
    };

    sortComments(tree);
    return tree;
};

const mediaReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_MEDIA:
            return {
                ...state,
                media: action.payload,
            };
        case ADD_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: [action.payload, ...state.media.data],
                    total: state.media.total + 1,
                },
            };
        case UPDATE_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: state.media.data.map((item) =>
                        item.id === action.payload.id ? action.payload : item
                    ),
                },
            };
        case DELETE_MEDIA:
            return {
                ...state,
                media: {
                    ...state.media,
                    data: state.media.data.filter(
                        (item) => item.id !== action.payload
                    ),
                    total: state.media.total - 1,
                },
                comments: {
                    ...state.comments,
                    [action.payload]: undefined,
                },
            };
        case SET_COMMENTS:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [action.payload.mediaId]: action.payload.comments,
                },
            };
        case APPEND_COMMENTS: {
            const { mediaId, comments: newComments } = action.payload;
            const currentComments = state.comments[mediaId] || [];
            const flatCurrent = flattenComments(currentComments);
            const flatNew = flattenComments(newComments);
            const combinedComments = [
                ...flatCurrent,
                ...flatNew.filter(
                    (newComment) =>
                        !flatCurrent.some(
                            (current) => current.id === newComment.id
                        )
                ),
            ];
            const newTree = buildCommentTree(combinedComments);
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [mediaId]: newTree,
                },
            };
        }
        case ADD_COMMENT: {
            const { mediaId, comment } = action.payload;
            const currentComments = state.comments[mediaId] || [];
            const flatComments = flattenComments(currentComments);
            let updatedComments = [...flatComments];

            if (comment.parent_id) {
                const parentComment = updatedComments.find(
                    (c) => c.id === comment.parent_id
                );
                if (parentComment) {
                    parentComment.children = [
                        ...(parentComment.children || []),
                        { ...comment, children: [] },
                    ];
                } else {
                    console.warn(`Parent comment ${comment.parent_id} not found, adding as top-level`);
                    updatedComments = [
                        { ...comment, children: [] },
                        ...updatedComments,
                    ];
                }
            } else {
                updatedComments = [
                    { ...comment, children: [] },
                    ...updatedComments,
                ];
            }

            const newTree = buildCommentTree(updatedComments);
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [mediaId]: newTree,
                },
            };
        }
        case UPDATE_COMMENT:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    ...Object.keys(state.comments).reduce((acc, mediaId) => {
                        acc[mediaId] = buildCommentTree(
                            flattenComments(state.comments[mediaId]).map((comment) =>
                                comment.id === action.payload.commentId
                                    ? { ...comment, ...action.payload.comment }
                                    : comment
                            )
                        );
                        return acc;
                    }, {}),
                },
            };
        case DELETE_COMMENT:
            return {
                ...state,
                comments: {
                    ...state.comments,
                    ...Object.keys(state.comments).reduce((acc, mediaId) => {
                        const filterComments = (comments) =>
                            comments
                                .filter((comment) => comment.id !== action.payload)
                                .map((comment) => ({
                                    ...comment,
                                    children: comment.children
                                        ? filterComments(comment.children)
                                        : [],
                                }));
                        acc[mediaId] = buildCommentTree(
                            filterComments(state.comments[mediaId])
                        );
                        return acc;
                    }, {}),
                },
            };
        default:
            return state;
    }
};

export default mediaReducer;