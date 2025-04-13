// src/components/Dashboard.jsx
import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { ShoppingCartOutlined, TeamOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title } = Typography;

function Dashboard() {
  return (
    <div>
      <Title level={2}>Welcome to the Dashboard!</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Orders"
              value={150}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={320}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Customers"
              value={85}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;