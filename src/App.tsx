import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { HealthInput } from './pages/HealthInput';
import { Simulation } from './pages/Simulation';
import { HealthGraph } from './pages/HealthGraph';
import { Recommendations } from './pages/Recommendations';
import { Timeline } from './pages/Timeline';
import { Consultation } from './pages/Consultation';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { ArchitecturePipeline } from './pages/ArchitecturePipeline';

// Route Gating Component
const ProtectedRoute: React.FC<{ children: React.JSX.Element }> = ({ children }) => {
  const { isLoggedIn } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Route Login Gate (re-route dashboard if already logged in)
const LoginRoute: React.FC<{ children: React.JSX.Element }> = ({ children }) => {
  const { isLoggedIn } = useApp();

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            }
          />

          {/* Protected Main Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/input"
            element={
              <ProtectedRoute>
                <HealthInput />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulation"
            element={
              <ProtectedRoute>
                <Simulation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/graph"
            element={
              <ProtectedRoute>
                <HealthGraph />
              </ProtectedRoute>
            }
          />
          <Route
            path="/architecture"
            element={
              <ProtectedRoute>
                <ArchitecturePipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <Timeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brief"
            element={
              <ProtectedRoute>
                <Consultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
