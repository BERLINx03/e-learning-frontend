import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/themes.css';
import './styles/utilities.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourses from './pages/instructor/Courses';
import CourseForm from './pages/instructor/CourseForm';
import LessonManagement from './pages/instructor/lessons/LessonManagement';
import LessonDetails from './pages/lessons/LessonDetails';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';

// Theme wrapper component to ensure theme changes are properly applied
const ThemedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  
  // Add a data-theme attribute to body for additional CSS targeting
  useEffect(() => {
    document.body.setAttribute('data-theme', resolvedTheme);
    
    // Clean up
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [resolvedTheme]);
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedApp>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-primary">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:id" element={<CourseDetails />} />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    {/* Add protected routes for both roles here */}
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/edit" element={<ProfileEdit />} />
                    <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
                    <Route path="/lessons/:id" element={<LessonDetails />} />
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
                    <Route path="/instructor/courses/:courseId/lessons" element={<LessonManagement />} />
                  </Route>
                  
                  {/* Admin-only routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<div>Admin Dashboard (Coming Soon)</div>} />
                  </Route>
                  
                  {/* Catch-all route - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <footer className="bg-footer border-t border-border text-secondary py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-center md:text-left">© {new Date().getFullYear()} E-Learning Platform. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex space-x-4">
                      <a href="#" className="text-secondary hover:text-accent transition-colors">Terms</a>
                      <a href="#" className="text-secondary hover:text-accent transition-colors">Privacy</a>
                      <a href="#" className="text-secondary hover:text-accent transition-colors">Contact</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </ThemedApp>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
