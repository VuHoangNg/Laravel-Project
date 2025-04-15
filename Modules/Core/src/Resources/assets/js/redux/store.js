import { createStore, applyMiddleware, combineReducers } from "redux";
import { thunk } from "redux-thunk";
import blogReducer from "../../../../../../Blog/src/Resources/assets/js/redux/reducer";
import authReducer from "./reducer";

const rootReducer = combineReducers({
    auth: authReducer,
    blogs: blogReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));
