// src/app.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux'; // Add react-redux imports
import { store } from './store'; // Ensure this path is correct
import { setLocation } from './features/routerSlice'; // Ensure this path is correct
import { clearRedirect } from './features/coreSlice'; // Ensure this path is correct
import SignUp from './components/SignUp';
import Home from './components/Home';
import RootLayout from './components/Layout';
import { Button, Typography, Row, Col, Card } from 'antd';
import Login from './components/LogIn';

const { Title, Paragraph } = Typography;

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.core);
  return token ? children : <Navigate to='/login' />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { redirectTo } = useSelector((state) => state.core);

  useEffect(() => {
    dispatch(setLocation(location));
  }, [location, dispatch]);

  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
      dispatch(clearRedirect());
    }
  }, [redirectTo, navigate, dispatch]);

  return (
    <Routes>
      <Route
        path='/*'
        element={
          <RootLayout>
            <Routes>
              <Route
                path='/'
                element={
                  <Row justify='center' align='middle' style={{ minHeight: '100%' }}>
                    <Col xs={22} sm={16} md={12} lg={8}>
                      <Card
                        style={{
                          borderRadius: '10px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          animation: 'fadeIn 0.5s ease-in-out',
                        }}
                      >
                        <Title level={2} style={{ textAlign: 'center', color: '#2c3e50' }}>
                          Welcome to the V APP
                        </Title>
                        <Paragraph
                          style={{
                            textAlign: 'center',
                            color: '#7f8c8d',
                            fontSize: '1.1rem',
                            marginBottom: '30px',
                          }}
                        >
                          Securely manage your account with ease. Log in to access your
                          dashboard or sign up to get started.
                        </Paragraph>
                        <Row justify='center' gutter={16}>
                          <Col>
                            <Link to='/login'>
                              <Button
                                type='primary'
                                size='large'
                                style={{ borderRadius: '5px', padding: '0 30px' }}
                              >
                                Log In
                              </Button>
                            </Link>
                          </Col>
                          <Col>
                            <Link to='/signup'>
                              <Button
                                size='large'
                                style={{ borderRadius: '5px', padding: '0 30px' }}
                              >
                                Sign Up
                              </Button>
                            </Link>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                }
              />
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<SignUp />} />
              <Route
                path='/home/*'
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </RootLayout>
        }
      />
    </Routes>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  const root = ReactDOM.createRoot(appElement);
  root.render(
    <Provider store={store}>
      <Router basename='/core'>
        <App />
      </Router>
    </Provider>
  );
}