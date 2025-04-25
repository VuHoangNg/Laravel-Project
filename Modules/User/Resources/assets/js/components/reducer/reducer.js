import {
    SET_USERS,
    ADD_USER,
    UPDATE_USER,
    DELETE_USER,
} from "../reducer/action";

const initialState = {
    users: {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    },
};

export default function userReducer(state = initialState, action) {
    switch (action.type) {
        case SET_USERS:
            return {
                ...state,
                users: action.payload,
            };
        case ADD_USER:
            return {
                ...state,
                users: {
                    ...state.users,
                    data: [action.payload, ...state.users.data],
                    total: state.users.total + 1,
                },
            };
        case UPDATE_USER:
            return {
                ...state,
                users: {
                    ...state.users,
                    data: [
                        action.payload,
                        ...state.users.data.filter(
                            (user) => user.id !== action.payload.id
                        ),
                    ],
                },
            };
        case DELETE_USER:
            return {
                ...state,
                users: {
                    ...state.users,
                    data: state.users.data.filter(
                        (user) => user.id !== action.payload
                    ),
                    total: state.users.total - 1,
                },
            };
        default:
            return state;
    }
}