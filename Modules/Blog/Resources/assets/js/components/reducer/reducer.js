import { SET_MEDIA } from "../../../../../../Media/Resources/assets/js/components/reducer/action";
import {
    SET_BLOGS,
    ADD_BLOG,
    UPDATE_BLOG,
    DELETE_BLOG,
} from "./action";

const initialState = {
    blogs: {
        data: [],
        current_page: 1,
        per_page: 12,
        total: 0,
        last_page: 1,
    },
    media: {
        data: [],
        current_page: 1,
        per_page: 6,
        total: 0,
        last_page: 1,
    },
};

export default function blogReducer(state = initialState, action) {
    switch (action.type) {
        case SET_BLOGS:
            return {
                ...state,
                blogs: action.payload,
            };
        case ADD_BLOG:
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: [action.payload, ...state.blogs.data],
                    total: state.blogs.total + 1,
                    current_page: 1, // Reset to first page
                },
            };
        case UPDATE_BLOG:
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: [
                        action.payload,
                        ...state.blogs.data.filter(
                            (blog) => blog.id !== action.payload.id
                        ),
                    ],
                    current_page: 1, // Reset to first page
                },
            };
        case DELETE_BLOG:
            return {
                ...state,
                blogs: {
                    ...state.blogs,
                    data: state.blogs.data.filter(
                        (blog) => blog.id !== action.payload
                    ),
                    total: state.blogs.total - 1,
                },
            };
        case SET_MEDIA:
            return { ...state, media: action.payload };
        default:
            return state;
    }
}