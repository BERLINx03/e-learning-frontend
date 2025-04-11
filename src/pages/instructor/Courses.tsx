import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CourseAPI, Course, Enrollment } from '../../api/axios';

// Define types for our data
type CourseWithEnrollments = Course & {
  enrollments: (Enrollment & { id: number; studentId: number })[];
}

const InstructorCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<CourseWithEnrollments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 10;

  useEffect(() => {
    // Check if user is instructor
    if (user?.role !== 'instructor') {
      navigate('/'); // Redirect to home if not instructor
      return;
    }

    // Fetch instructor courses
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
        
        setAllCourses(instructorCourses);
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

  const handleToggleStatus = async (courseId: number, course: CourseWithEnrollments) => {
    try {
      // Toggle the isPublished status
      const newStatus = !course.isPublished;
      
      // Create a copy of the course data with the updated status
      const updatedCourse = {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnailUrl: course.thumbnailUrl,
        isPublished: newStatus
      };
      
      const response = await CourseAPI.updateCourse(courseId, updatedCourse);
      
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current courses for the page
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = allCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(allCourses.length / coursesPerPage);

  // Pagination controls
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded ${
            currentPage === i 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-blue-600 hover:bg-blue-100'
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mx-1 px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50"
        >
          &laquo;
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="mx-1 px-3 py-1 rounded bg-white text-blue-600 hover:bg-blue-100 disabled:opacity-50"
        >
          &raquo;
        </button>
      </div>
    );
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate stats
  const publishedCoursesCount = allCourses.filter(course => course.isPublished).length;
  const draftCoursesCount = allCourses.length - publishedCoursesCount;
  const totalStudents = allCourses.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header section with stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Courses</h1>
              <p className="text-gray-600">Manage your courses and track student enrollments</p>
            </div>
            <button 
              onClick={handleCreateCourse}
              className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Course
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Courses</h2>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{allCourses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Published Courses</h2>
                  <div className="flex items-center">
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{publishedCoursesCount}</p>
                    <p className="ml-2 text-xs text-gray-500">({draftCoursesCount} drafts)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Students</h2>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
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
        
        {/* Main content */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">All Courses</h2>
              <p className="mt-1 text-sm text-gray-500">View and manage all your courses</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500">Loading your courses...</p>
              </div>
            </div>
          ) : allCourses.length === 0 ? (
            <div className="text-center py-16 px-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">Get started by creating your first course. You can add lessons, enroll students, and track progress.</p>
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
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-md overflow-hidden">
                              {course.thumbnailUrl ? (
                                <img src={course.thumbnailUrl} alt={course.title} className="h-12 w-12 object-cover" />
                              ) : (
                                <div className="h-12 w-12 flex items-center justify-center bg-blue-50 text-blue-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">{course.category}</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">{course.level}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-500">${course.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(course.createdAt)}</div>
                          <div className="text-xs text-gray-500">{new Date(course.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 font-medium">{course.enrollments?.length || 0}</div>
                            <span className="ml-1 text-xs text-gray-500">students</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleToggleStatus(course.id, course)}
                              className={`inline-flex items-center px-2.5 py-1.5 border rounded-md text-xs font-medium ${
                                course.isPublished 
                                  ? 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100' 
                                  : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                              title={course.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {course.isPublished ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Publish
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleEditCourse(course.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 bg-blue-50 text-blue-800 rounded-md text-xs font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Edit course"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleManageLessons(course.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-800 rounded-md text-xs font-medium hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Manage lessons"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Lessons
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-red-300 bg-red-50 text-red-800 rounded-md text-xs font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Delete course"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  {renderPagination()}
                </div>
              )}
              
              {/* Course count indicator */}
              {allCourses.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                  Showing {currentCourses.length} of {allCourses.length} courses
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses; 