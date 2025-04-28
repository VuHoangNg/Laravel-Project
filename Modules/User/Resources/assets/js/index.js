import React from "react";
import { UserProvider, useUserContext } from "./components/context/UserContext";
import { Routes, Route } from "react-router-dom";
import UserContent from "./components/page/UserContent";
import UserDetail from "./components/action/UserDetail";

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p>Please refresh the page or try again later.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function User({ api }) {
    return (
        <UserProvider api={api}>
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<UserContent api={api} />} />
                    <Route path="/:id" element={<UserDetail api={api} />} />
                </Routes>
            </ErrorBoundary>
        </UserProvider>
    );
}

export default User;
