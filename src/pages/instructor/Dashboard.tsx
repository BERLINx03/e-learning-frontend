import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API, { CourseAPI, Course } from '../../api/axios';

// Define types for our data
interface CourseWithEnrollments extends Course {
  enrollments: { id: number; studentId: number }[];
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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Instructor Dashboard</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
        
        {/* Dashboard Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Stats Cards */}
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <div className="text-blue-500 text-xl font-bold">{stats.totalCourses}</div>
                <div className="text-gray-600">Courses</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg shadow">
                <div className="text-green-500 text-xl font-bold">{stats.totalStudents}</div>
                <div className="text-gray-600">Students</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg shadow">
                <div className="text-purple-500 text-xl font-bold">{stats.totalLessons}</div>
                <div className="text-gray-600">Lessons</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg shadow">
                <div className="text-yellow-500 text-xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <div className="text-gray-600">Earnings</div>
              </div>
            </div>
            
            {/* Recently Added Courses */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recently Added Courses</h3>
                <button
                  onClick={handleCreateCourse}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Course
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
                  <p className="mt-1 text-gray-500">Get started by creating your first course.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentCourses.map(course => (
                    <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-gray-200 relative">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1 truncate">{course.title}</h4>
                        <p className="text-sm text-gray-500 mb-3 truncate">{course.category} • {course.level}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">${course.price.toFixed(2)}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCourse(course.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleManageLessons(course.id)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                              Lessons
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-3 mt-8">Recent Activity</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard; 