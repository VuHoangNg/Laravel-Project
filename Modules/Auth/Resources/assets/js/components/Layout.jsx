import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function Layout() {
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#282c34',
                padding: '10px 20px',
                color: 'white',
                textAlign: 'center',
                fontSize: '1.5em',
            }}>
                <h1>Auth Module</h1>
            </header>

            {/* Navigation Links */}
            <nav style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                textAlign: 'center',
            }}>
                <Link to="/login" style={{ margin: '0 10px', textDecoration: 'none', color: '#007bff' }}>
                    Login
                </Link>
                <Link to="/signup" style={{ margin: '0 10px', textDecoration: 'none', color: '#007bff' }}>
                    Sign Up
                </Link>
            </nav>

            {/* Main Content */}
            <main style={{
                flex: '1',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#fdfdfd',
            }}>
                <Outlet /> {/* Dynamically renders child routes */}
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#f1f1f1',
                padding: '10px 20px',
                textAlign: 'center',
                borderTop: '1px solid #ddd',
            }}>
                <p>&copy; {new Date().getFullYear()} Auth Module. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Layout;