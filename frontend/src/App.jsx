import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ChatBot from './components/ChatBot';
import Layout from './components/Layout';
import { UserProvider } from './context/UserContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0F', color: '#fff', flexDirection: 'column', gap: 16, padding: 32 }}>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <pre style={{ background: '#1a1a2e', padding: 16, borderRadius: 8, maxWidth: 600, overflowX: 'auto', fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#77838c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Routes that share the Dashboard Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai-assistant" element={<ChatBot />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </ErrorBoundary>
  );
}
