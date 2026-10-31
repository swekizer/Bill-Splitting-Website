import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadBill from './pages/UploadBill';
import BillRoom from './pages/BillRoom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#F7F6F2] text-[#202522] flex flex-col font-sans selection:bg-[#FDF3EE] selection:text-[#D97745]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadBill />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bill/:id"
                element={
                  <ProtectedRoute>
                    <BillRoom />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
