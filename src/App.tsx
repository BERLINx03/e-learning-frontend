import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* Add protected routes for both roles here */}
              </Route>
              
              {/* Student-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/my-courses" element={<div>My Courses (Coming Soon)</div>} />
              </Route>
              
              {/* Instructor-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
                <Route path="/course-management" element={<div>Course Management (Coming Soon)</div>} />
              </Route>
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<div>Admin Dashboard (Coming Soon)</div>} />
              </Route>
              
              {/* Catch-all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center">© {new Date().getFullYear()} E-Learning Platform. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
