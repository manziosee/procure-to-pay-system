import { Routes, Route, Navigate } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import EditRequest from './pages/EditRequest';
import RequestDetail from './pages/RequestDetail';
import Approvals from './pages/Approvals';
import FinanceDashboard from './pages/FinanceDashboard';
import TestLanding from './pages/TestLanding';
import Unauthorized from './pages/Unauthorized';
import Navbar from './components/Navbar';
import { RoleBasedRoute } from './components/RoleBasedRoute';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test" element={<TestLanding />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Staff Routes */}
            <Route element={<RoleBasedRoute allowedRoles={['staff']} redirectTo="/unauthorized" />}>
              <Route path="/requests/new" element={<CreateRequest />} />
              <Route path="/requests/:id/edit" element={<EditRequest />} />
            </Route>
            
            {/* Approver Routes */}
            <Route element={<RoleBasedRoute allowedRoles={['approver_level_1', 'approver_level_2']} redirectTo="/unauthorized" />}>
              <Route path="/approvals" element={<Approvals />} />
            </Route>
            
            {/* Finance Routes */}
            <Route element={<RoleBasedRoute allowedRoles={['finance']} redirectTo="/unauthorized" />}>
              <Route path="/finance" element={<FinanceDashboard />} />
            </Route>
            
            {/* Common Routes - Accessible to all authenticated users */}
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/test" element={<TestLanding />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;