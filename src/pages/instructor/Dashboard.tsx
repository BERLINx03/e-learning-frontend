import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API, { CourseAPI, Course, Enrollment } from '../../api/axios';

// Define types for our data
type CourseWithEnrollments = Course & {
  enrollments: (Enrollment & { id: number; studentId: number })[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  // Additional properties that might be available from the profile API
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  bio?: string;
}

interface ApiResponse {
  isSuccess: boolean;
  message: string;
  errors?: string[];
  data?: any;
  statusCode: number;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [courses, setCourses] = useState<CourseWithEnrollments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    // Check if user is instructor
    if (user?.role !== 'instructor') {
      navigate('/'); // Redirect to home if not instructor
      return;
    }

    // Fetch instructor data
    fetchCourses();
  }, [user, navigate]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await CourseAPI.getAllCourses();
      
      if (response.isSuccess && response.data) {
        // Convert instructorId to string for comparison if needed
        const userId = typeof user?.id === 'number' ? user.id.toString() : user?.id;

        // Filter courses by instructor ID on frontend
        const instructorCourses = response.data.filter(
          (course) => course.instructorId === user?.id || course.instructorId.toString() === userId
        ) as CourseWithEnrollments[];
        
        setCourses(instructorCourses);
        
        // Update stats
        setStats({
          totalCourses: instructorCourses.length,
          totalStudents: calculateTotalStudents(instructorCourses), // Calculate from enrollments
          totalLessons: calculateTotalLessons(instructorCourses), // Calculate from lessons
          totalEarnings: calculateTotalEarnings(instructorCourses) // Calculate from course prices
        });
      } else {
        setError(response.message || 'Failed to fetch courses');
        console.error('Failed to fetch courses:', response.message);
      }
    } catch (error) {
      setError('Failed to fetch courses. Please try again.');
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalStudents = (courses: CourseWithEnrollments[]): number => {
    return courses.reduce((total, course) => total + (course.enrollments?.length || 0), 0);
  };

  const calculateTotalLessons = (courses: CourseWithEnrollments[]): number => {
    return courses.reduce((total, course) => total + (course.lessons?.length || 0), 0);
  };

  const calculateTotalEarnings = (courses: CourseWithEnrollments[]): number => {
    return courses.reduce((total, course) => {
      const enrollmentCount = course.enrollments?.length || 0;
      return total + (course.price * enrollmentCount);
    }, 0);
  };

  const handleCreateCourse = () => {
    navigate('/instructor/courses/create');
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/instructor/courses/edit/${courseId}`);
  };

  const handleManageLessons = (courseId: number) => {
    setSelectedCourseId(courseId);
    setActiveTab('courses');
    setActiveSubTab('lessons');
  };

  const handleStudentProgress = (courseId: number) => {
    setSelectedCourseId(courseId);
    setActiveTab('courses');
    setActiveSubTab('progress');
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await CourseAPI.deleteCourse(courseId);
        if (response.isSuccess) {
          // Refresh course list
          fetchCourses();
        } else {
          alert(`Failed to delete course: ${response.message}`);
        }
      } catch (error) {
        console.error('Failed to delete course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (courseId: number, isPublished: boolean) => {
    try {
      const response = await CourseAPI.updateCourse(courseId, { 
        isPublished: !isPublished 
      });
      
      if (response.isSuccess) {
        // Refresh course list
        fetchCourses();
      } else {
        alert(`Failed to update course status: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to update course status:', error);
      alert('Failed to update course status. Please try again.');
    }
  };

  // Get recently added courses (up to 3)
  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Find selected course if any
  const selectedCourse = courses.find(course => course.id === selectedCourseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.firstName || user?.username}! Manage your courses and students.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Courses</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCourses}</h3>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                {stats.totalCourses > 0 ? 'Click to view all courses' : 'Create your first course'}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Students</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</h3>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                {stats.totalStudents > 0 ? 'Total enrolled students' : 'No students enrolled yet'}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lessons</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLessons}</h3>
              </div>
              <div className="rounded-full bg-purple-50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                {stats.totalLessons > 0 ? 'Total course lessons' : 'Create your first lesson'}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Earnings</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">${stats.totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="rounded-full bg-yellow-50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500">Total revenue</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recently Added Courses */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recently Added Courses</h2>
                <button 
                  onClick={() => navigate('/instructor/courses')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-base font-medium text-gray-900">No courses found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/instructor/courses/create')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Course
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentCourses.map(course => (
                    <div key={course.id} className="flex flex-col sm:flex-row border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="sm:w-40 h-32 sm:h-auto bg-gray-100 relative">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/150x100?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{course.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 mr-2">{course.category}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 mr-2">{course.level}</span>
                            <span>${course.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                        </div>
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleEditCourse(course.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleManageLessons(course.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-800 rounded-md text-sm font-medium hover:bg-indigo-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Lessons
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentCourses.length > 0 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => navigate('/instructor/courses/create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Course
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links & Upcoming Activity */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <a
                    href="/instructor/courses/create"
                    className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="bg-blue-100 rounded-md p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Create New Course</h3>
                      <p className="text-sm opacity-80">Add a new course to your catalog</p>
                    </div>
                  </a>
                  
                  <a
                    href="/instructor/courses"
                    className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="bg-purple-100 rounded-md p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Manage Courses</h3>
                      <p className="text-sm opacity-80">Update or delete your courses</p>
                    </div>
                  </a>
                  
                  <a
                    href="/profile/edit"
                    className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="bg-green-100 rounded-md p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Update Profile</h3>
                      <p className="text-sm opacity-80">Edit your instructor profile</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center py-8 text-center text-gray-500">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Activity tracking coming soon</p>
                    <p className="text-xs mt-1">We're working on this feature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard; 