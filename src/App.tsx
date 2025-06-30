import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import LazyWrapper from './components/common/LazyWrapper';

import ToastContainer from './components/common/ToastContainer';
import ThemeProvider from './components/ThemeProvider';

// Lazy load heavy components
const PeriodicTable = lazy(() => import('./pages/PeriodicTable'));
const PeriodicTableElement = lazy(() => import('./pages/PeriodicTableElement'));

const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/dashboard"
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
              />
              <Route
                path="/settings"
                element={
                  isAuthenticated ? (
                    <LazyWrapper>
                      <Settings />
                    </LazyWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route 
                path="/periodic-table" 
                element={
                  isAuthenticated ? (
                    <LazyWrapper>
                      <PeriodicTableElement />
                    </LazyWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                } 
              />
              <Route 
                path="/reaction/*" 
                element={
                  isAuthenticated ? (
                    <LazyWrapper>
                      <PeriodicTable />
                    </LazyWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                } 
              />
              {/* Catch all route - redirect to home or dashboard based on auth */}
              <Route 
                path="*" 
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} 
              />
            </Routes>
          </Layout>
          <ToastContainer />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;