import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CourseAPI, Course } from '../../api/axios';

const InstructorCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
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
      const response = await CourseAPI.getMyCourses();
      
      if (response.isSuccess && response.data) {
        setAllCourses(response.data);
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

  const handleToggleStatus = async (courseId: number, course: Course) => {
    try {
      const response = await CourseAPI.updateCourse(courseId, { 
        isPublished: !course.isPublished 
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
              ? 'bg-accent text-white' 
              : 'bg-card text-accent hover:bg-secondary'
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
          className="mx-1 px-3 py-1 rounded bg-card text-accent hover:bg-secondary disabled:opacity-50"
        >
          &laquo;
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="mx-1 px-3 py-1 rounded bg-card text-accent hover:bg-secondary disabled:opacity-50"
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
  const totalStudents = allCourses.reduce((sum, course) => sum + course.studentCount, 0);

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header section with stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Your Courses</h1>
              <p className="text-secondary">Manage your courses and track student enrollments</p>
            </div>
            <button 
              onClick={handleCreateCourse}
              className="mt-4 md:mt-0 bg-accent text-white px-4 py-2 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors flex items-center shadow-theme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Course
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg shadow-theme p-5 border border-border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent bg-opacity-10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-secondary">Total Courses</h2>
                  <p className="mt-1 text-3xl font-semibold text-primary">{allCourses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-theme p-5 border border-border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-success bg-opacity-10 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-secondary">Published Courses</h2>
                  <div className="flex items-center">
                    <p className="mt-1 text-3xl font-semibold text-primary">{publishedCoursesCount}</p>
                    <p className="ml-2 text-xs text-secondary">({draftCoursesCount} drafts)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-theme p-5 border border-border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent bg-opacity-10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-secondary">Total Students</h2>
                  <p className="mt-1 text-3xl font-semibold text-primary">{totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-danger bg-opacity-10 border-l-4 border-danger p-4 mb-6 rounded">
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
        
        {/* Main content */}
        <div className="bg-card shadow-theme rounded-lg overflow-hidden border border-border">
          <div className="border-b border-border p-4">
            <h2 className="text-xl font-semibold text-primary">Course List</h2>
          </div>
          
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="py-10 px-4 text-center">
              <div className="bg-danger bg-opacity-10 rounded-lg p-4 inline-block mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-primary">{error}</h3>
              <button
                onClick={fetchCourses}
                className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-opacity-90"
              >
                Try again
              </button>
            </div>
          ) : allCourses.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-primary">No courses found</h3>
              <p className="mt-1 text-secondary">Get started by creating your first course.</p>
              <button
                onClick={handleCreateCourse}
                className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-opacity-90 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create a course
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-secondary bg-opacity-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Lessons</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-secondary hover:bg-opacity-10">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-lg object-cover" 
                                src={course.thumbnailUrl || '/default-course-thumbnail.jpg'} 
                                alt={course.title} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-primary">{course.title}</div>
                              <div className="text-sm text-secondary">{course.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.isPublished 
                              ? 'bg-success bg-opacity-10 text-success' 
                              : 'bg-warning bg-opacity-10 text-warning'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                          {course.studentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                          {course.lessonCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          {formatDate(course.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                          ${course.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleToggleStatus(course.id, course)}
                              className={`${
                                course.isPublished 
                                  ? 'text-warning hover:text-warning-dark' 
                                  : 'text-success hover:text-success-dark'
                              } transition-colors duration-200`}
                            >
                              {course.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleEditCourse(course.id)}
                              className="text-accent hover:text-accent-dark"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleManageLessons(course.id)}
                              className="text-primary hover:text-accent"
                            >
                              Lessons
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-danger hover:text-danger-dark"
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
              {totalPages > 1 && renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses; 