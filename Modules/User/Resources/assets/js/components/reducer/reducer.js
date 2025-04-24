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
        case "users/setUsers":
            return {
                ...state,
                users: action.payload,
            };
        case "users/addUser":
            return {
                ...state,
                users: {
                    ...state.users,
                    data: [action.payload, ...state.users.data],
                    total: state.users.total + 1,
                },
            };
        case "users/updateUser":
            return {
                ...state,
                users: {
                    ...state.users,
                    data: [
                        action.payload,
                        ...state.users.data.filter((user) => user.id !== action.payload.id),
                    ],
                },
            };
        case "users/deleteUser":
            return {
                ...state,
                users: {
                    ...state.users,
                    data: state.users.data.filter((user) => user.id !== action.payload),
                    total: state.users.total - 1,
                },
            };
        default:
            return state;
    }
}