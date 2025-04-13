// src/components/Home.jsx
import React from 'react';
import { Layout, Menu, Typography, Breadcrumb, theme, Modal } from 'antd';
import {
  Link,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/coreSlice';
import Dashboard from './Dashboard';

const { Sider, Content } = Layout;
const { Title } = Typography;

function Home() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token } = useSelector((state) => state.core);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  if (!token) {
    return <Navigate to='/login' replace />;
  }

  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to log out?',
      onOk: () => {
        dispatch(logout());
      },
    });
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to='/home'>Dashboard</Link>,
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to='/home/orders'>Orders</Link>,
    },
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: <Link to='/home/products'>Products</Link>,
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: <Link to='/home/customers'>Customers</Link>,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to='/home/profile'>Profile</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const selectedKey = location.pathname.split('/').pop() || 'dashboard';

  const breadcrumbItems = [
    {
      title: 'Home',
      href: '/home',
    },
    {
      title: selectedKey.charAt(0).toUpperCase() + selectedKey.slice(1),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        collapsible
        width={200}
        style={{
          backgroundColor: '#fff',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
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

      <Layout style={{ padding: '0 24px 24px', background: 'transparent' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          {breadcrumbItems.map((item, index) => (
            <Breadcrumb.Item key={index} href={item.href}>
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>

        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<div>Orders Page</div>} />
            <Route path="/products" element={<div>Products Page</div>} />
            <Route path="/customers" element={<div>Customers Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Home;