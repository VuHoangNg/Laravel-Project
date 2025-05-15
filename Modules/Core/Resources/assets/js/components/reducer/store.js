import { createStore, applyMiddleware, combineReducers } from "redux";
import { thunk } from "redux-thunk";
import authReducer from "./reducer";
import mediaReducer from "../../../../../../Media/Resources/assets/js/components/reducer/reducer";
import userReducer from "../../../../../../User/Resources/assets/js/components/reducer/reducer";
import blogReducer from "../../../../../../Blog/Resources/assets/js/components/reducer/reducer";
import scriptReducer from "../../../../../../Script/Resources/assets/js/components/reducer/reducer";

const rootReducer = combineReducers({
    auth: authReducer,
    blogs: blogReducer,
    media: mediaReducer,
    users: userReducer,
    scripts: scriptReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));
