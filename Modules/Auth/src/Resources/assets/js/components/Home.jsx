import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { DashboardOutlined, UserOutlined, LogoutOutlined, ShoppingCartOutlined, AppstoreOutlined, TeamOutlined } from '@ant-design/icons';

// Import the new components

// import Orders from './Orders';
// import Products from './Products';
// import Customers from './Customers';
// import Profile from './Profile';
import Dashboard from './Dashboard';

const { Sider, Content } = Layout;
const { Title } = Typography;

function Home() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/home">Dashboard</Link>,
        },
        {
            key: 'orders',
            icon: <ShoppingCartOutlined />,
            label: <Link to="/home/orders">Orders</Link>,
        },
        {
            key: 'products',
            icon: <AppstoreOutlined />,
            label: <Link to="/home/products">Products</Link>,
        },
        {
            key: 'customers',
            icon: <TeamOutlined />,
            label: <Link to="/home/customers">Customers</Link>,
        },
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/home/profile">Profile</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
        },
    ];

    // Determine the selected key based on the current route
    const selectedKey = location.pathname.split('/').pop() || 'dashboard';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sider width={200} style={{ backgroundColor: '#fff', boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#2c3e50', margin: 0 }}>
                        V APP
                    </Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    style={{ minHeight: 280, borderRight: 0 }}
                />
            </Sider>

            {/* Main Content */}
            <Layout style={{ padding: '0 24px 24px' }}>
                <Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: '#f5f7fa',
                        borderRadius: '10px',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        {/* <Route path="/orders" element={<Orders />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/profile" element={<Profile />} /> */}
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

export default Home;