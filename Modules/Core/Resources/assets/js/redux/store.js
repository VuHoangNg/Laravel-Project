import { createStore, applyMiddleware, combineReducers } from "redux";
import { thunk } from "redux-thunk";
import blogReducer from "../../../../../Blog/Resources/assets/js/redux/reducer";
import authReducer from "./reducer";
import mediaReducer from "../../../../../Media/Resources/assets/js/redux/reducer";
import userReducer from "../../../../../User/Resources/assets/js/redux/reducer";

const rootReducer = combineReducers({
    auth: authReducer,
    blogs: blogReducer,
    media: mediaReducer,
    users: userReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));
