import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API, { CourseAPI, Course } from '../../api/axios';

// Define types for our data
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
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
  const [courses, setCourses] = useState<Course[]>([]);
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
      const response = await CourseAPI.getMyCourses();
      
      if (response.isSuccess && response.data) {
        setCourses(response.data);
        
        // Update stats using the new response format
        setStats({
          totalCourses: response.data.length,
          totalStudents: response.data.reduce((total, course) => total + course.studentCount, 0),
          totalLessons: response.data.reduce((total, course) => total + course.lessonCount, 0),
          totalEarnings: response.data.reduce((total, course) => total + (course.price * course.studentCount), 0)
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

  const handleCreateCourse = () => {
    navigate('/instructor/courses/create');
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/instructor/courses/edit/${courseId}`);
  };

  const handleManageLessons = (courseId: number) => {
    navigate(`/instructor/courses/${courseId}/lessons`);
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
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Instructor Dashboard</h1>
        
        {error && (
          <div className="bg-danger bg-opacity-10 border-l-4 border-danger p-4 mb-6 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Content */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div>
            <h2 className="text-xl font-medium mb-6 text-text-primary">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-secondary rounded-lg p-5">
                <div className="flex flex-row items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{stats.totalCourses}</div>
                    <div className="text-text-secondary text-sm">Courses</div>
                  </div>
                  <div className="rounded-full bg-accent bg-opacity-20 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary rounded-lg p-5">
                <div className="flex flex-row items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{stats.totalStudents}</div>
                    <div className="text-text-secondary text-sm">Students</div>
                  </div>
                  <div className="rounded-full bg-success bg-opacity-20 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary rounded-lg p-5">
                <div className="flex flex-row items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{stats.totalLessons}</div>
                    <div className="text-text-secondary text-sm">Lessons</div>
                  </div>
                  <div className="rounded-full bg-accent bg-opacity-20 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary rounded-lg p-5">
                <div className="flex flex-row items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">${stats.totalEarnings.toFixed(2)}</div>
                    <div className="text-text-secondary text-sm">Earnings</div>
                  </div>
                  <div className="rounded-full bg-warning bg-opacity-20 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recently Added Courses */}
            <div className="mt-10 p-6 rounded-lg border border-border bg-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-text-primary">Recently Added Courses</h3>
                <button 
                  onClick={handleCreateCourse}
                  className="bg-accent hover:bg-opacity-90 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Course
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="text-center py-10 bg-secondary bg-opacity-20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-text-secondary opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-text-primary">No courses found</h3>
                  <p className="mt-2 text-text-secondary">Get started by creating your first course.</p>
                  <button
                    onClick={handleCreateCourse}
                    className="mt-6 bg-accent text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-colors text-sm font-medium"
                  >
                    Create a course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentCourses.map(course => (
                    <div key={course.id} className="course-card bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                      <div className="course-image">
                        {course.thumbnailUrl ? (
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {course.isPublished !== undefined && (
                          <div className="absolute top-2 right-2 z-10">
                            {course.isPublished ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white shadow-sm">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning text-white shadow-sm">
                                Draft
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="course-content">
                        <h4 className="course-title" title={course.title}>
                          {course.title}
                        </h4>
                        <p className="course-description" title={course.description}>
                          {course.description}
                        </p>
                        <div className="flex justify-between items-center mt-auto">
                          <div className="course-price">
                            {course.price === 0 ? (
                              <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                                Free
                              </span>
                            ) : (
                              `$${course.price.toFixed(2)}`
                            )}
                          </div>
                          <div className="course-students">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{course.studentCount} students</span>
                          </div>
                        </div>
                      </div>
                      <div className="course-footer">
                        <button
                          onClick={() => handleEditCourse(course.id)}
                          className="text-accent hover:text-accent-dark text-sm font-medium flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageLessons(course.id)}
                          className="text-text-primary hover:text-accent text-sm font-medium flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Manage Lessons
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {courses.length > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate('/instructor/courses')}
                    className="text-accent hover:text-white hover:bg-accent px-5 py-2 rounded-full transition-colors inline-flex items-center text-sm font-medium border border-accent"
                  >
                    View all courses
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard; 