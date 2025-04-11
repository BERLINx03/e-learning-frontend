import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Define types for our data
interface Course {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  instructorId: string;
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
      const response = await axios.get('/api/Courses');
      
      // Filter courses by instructor ID on frontend
      const instructorCourses = response.data.filter(
        (course: Course) => course.instructorId === user?.id
      );
      
      setCourses(instructorCourses);
      
      // Update stats
      setStats({
        totalCourses: instructorCourses.length,
        totalStudents: 0, // Would come from an API
        totalLessons: 0, // Would come from an API
        totalEarnings: 0 // Would come from an API
      });
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Courses</h2>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
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
                <div className="text-center py-8">
                  <p className="text-gray-600">You haven't created any courses yet.</p>
                  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Create Your First Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {course.imageUrl && (
                        <img 
                          src={course.imageUrl} 
                          alt={course.title} 
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex justify-end space-x-2">
                          <button className="text-blue-500 hover:text-blue-700">Edit</button>
                          <button className="text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
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