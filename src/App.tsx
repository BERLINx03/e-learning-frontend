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
import Courses from './pages/Courses';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourses from './pages/instructor/Courses';
import CourseForm from './pages/instructor/CourseForm';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';

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
              <Route path="/courses" element={<Courses />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* Add protected routes for both roles here */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
              </Route>
              
              {/* Student-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/my-courses" element={<div>My Courses (Coming Soon)</div>} />
              </Route>
              
              {/* Instructor-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
                <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
                <Route path="/instructor/courses" element={<InstructorCourses />} />
                <Route path="/instructor/courses/create" element={<CourseForm />} />
                <Route path="/instructor/courses/edit/:courseId" element={<CourseForm />} />
                <Route path="/instructor/courses/:courseId/lessons" element={<div>Manage Lessons (Coming Soon)</div>} />
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
