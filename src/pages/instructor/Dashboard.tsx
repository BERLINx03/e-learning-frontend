import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../api/axios';

// Define types for our data
interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  instructorId: string;
  category: string;
  level: string;
  price: number;
  isPublished: boolean;
  enrollments: { id: number; studentId: number }[];
  createdAt: string;
  updatedAt: string;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      const response = await API.get<ApiResponse>('/api/Courses');
      
      if (response.data.isSuccess && response.data.data) {
        // Filter courses by instructor ID on frontend
        const instructorCourses = response.data.data.filter(
          (course: Course) => course.instructorId === user?.id
        );
        
        setCourses(instructorCourses);
        
        // Update stats
        setStats({
          totalCourses: instructorCourses.length,
          totalStudents: calculateTotalStudents(instructorCourses), // Calculate from enrollments
          totalLessons: 0, // Would come from an API
          totalEarnings: calculateTotalEarnings(instructorCourses) // Calculate from course prices
        });
      } else {
        console.error('Failed to fetch courses:', response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalStudents = (courses: Course[]): number => {
    return courses.reduce((total, course) => total + (course.enrollments?.length || 0), 0);
  };

  const calculateTotalEarnings = (courses: Course[]): number => {
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
    navigate(`/instructor/courses/${courseId}/lessons`);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await API.delete<ApiResponse>(`/api/Courses/${courseId}`);
        if (response.data.isSuccess) {
          // Refresh course list
          fetchCourses();
        } else {
          alert(`Failed to delete course: ${response.data.message}`);
        }
      } catch (error) {
        console.error('Failed to delete course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (courseId: number, isPublished: boolean) => {
    try {
      const response = await API.put<ApiResponse>(`/api/Courses/${courseId}`, { 
        isPublished: !isPublished 
      });
      
      if (response.data.isSuccess) {
        // Refresh course list
        fetchCourses();
      } else {
        alert(`Failed to update course status: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Failed to update course status:', error);
      alert('Failed to update course status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Instructor Dashboard</h1>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 px-1 ${
                activeTab === 'courses'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`pb-4 px-1 ${
                activeTab === 'lessons'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Lessons
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`pb-4 px-1 ${
                activeTab === 'progress'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Student Progress
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
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
                  <div className="text-yellow-500 text-xl font-bold">${stats.totalEarnings}</div>
                  <div className="text-gray-600">Earnings</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Courses</h2>
                <button 
                  onClick={handleCreateCourse}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
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
              ) : courses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
                  <p className="mt-1 text-gray-500">Get started by creating your first course.</p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateCourse}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Your First Course
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                                {course.thumbnailUrl ? (
                                  <img src={course.thumbnailUrl} alt={course.title} className="h-10 w-10 object-cover" />
                                ) : (
                                  <div className="h-10 w-10 flex items-center justify-center bg-blue-100 text-blue-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                <div className="text-sm text-gray-500">{course.category} • {course.level}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{course.enrollments?.length || 0} students</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              course.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${course.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleToggleStatus(course.id, course.isPublished)}
                                className={`${
                                  course.isPublished 
                                    ? 'text-yellow-600 hover:text-yellow-900' 
                                    : 'text-green-600 hover:text-green-900'
                                } focus:outline-none`}
                                title={course.isPublished ? 'Unpublish' : 'Publish'}
                              >
                                {course.isPublished ? 'Unpublish' : 'Publish'}
                              </button>
                              <button 
                                onClick={() => handleEditCourse(course.id)}
                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                title="Edit course"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleManageLessons(course.id)}
                                className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                title="Manage lessons"
                              >
                                Lessons
                              </button>
                              <button 
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-900 focus:outline-none"
                                title="Delete course"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Lessons Management</h2>
              <p className="text-gray-600">Select a course to manage its lessons.</p>
              
              {/* Course selection dropdown would go here */}
              <div className="mt-6">
                <p className="text-gray-600">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Student Progress Tab */}
          {activeTab === 'progress' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Student Progress</h2>
              <p className="text-gray-600">Track how your students are doing in your courses.</p>
              
              <div className="mt-6">
                <p className="text-gray-600">Coming soon...</p>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-300 rounded-full overflow-hidden">
                      {user?.profilePictureUrl ? (
                        <img 
                          src={user.profilePictureUrl} 
                          alt={`${user.firstName} ${user.lastName}`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-3xl text-gray-600">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <button className="text-blue-500 hover:text-blue-700">
                      Change Photo
                    </button>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue={user?.firstName}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue={user?.lastName}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={user?.email}
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={4}
                        defaultValue={user?.bio || ''}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        type="button" 
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button 
                          type="button" 
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard; 