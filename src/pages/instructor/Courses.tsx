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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header section with stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-heading mb-2 font-display">Your Courses</h1>
              <p className="text-muted font-body">Manage your courses and track student enrollments</p>
            </div>
            <button 
              onClick={handleCreateCourse}
              className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 flex items-center shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Course
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border/10 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-muted font-display">Total Courses</h2>
                  <p className="mt-1 text-3xl font-bold text-heading font-display">{allCourses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border/10 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-success/10 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-muted font-display">Published Courses</h2>
                  <div className="flex items-center">
                    <p className="mt-1 text-3xl font-bold text-heading font-display">{publishedCoursesCount}</p>
                    <p className="ml-2 text-xs text-muted">({draftCoursesCount} drafts)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border/10 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-muted font-display">Total Students</h2>
                  <p className="mt-1 text-3xl font-bold text-heading font-display">{totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-danger/10 border-l-4 border-danger p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="bg-card shadow-lg rounded-xl overflow-hidden border border-border/10 backdrop-blur-sm">
          <div className="border-b border-border/10 p-6">
            <h2 className="text-xl font-bold text-heading font-display">Course List</h2>
          </div>
          
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="py-10 px-4 text-center">
              <div className="bg-danger/10 rounded-lg p-4 inline-block mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-heading font-display">{error}</h3>
              <button
                onClick={fetchCourses}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium"
              >
                Try again
              </button>
            </div>
          ) : allCourses.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-lg font-bold text-heading font-display">No courses found</h3>
              <p className="mt-1 text-muted font-body">Get started by creating your first course.</p>
              <button
                onClick={handleCreateCourse}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium inline-flex items-center"
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
                  <thead className="bg-secondary/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Course</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Students</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Lessons</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider font-display">Price</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider font-display">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {currentCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-secondary/5 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img 
                                className="h-12 w-12 rounded-lg object-cover ring-2 ring-border/10" 
                                src={course.thumbnailUrl || '/default-course-thumbnail.jpg'} 
                                alt={course.title} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-heading font-display">{course.title}</div>
                              <div className="text-sm text-muted font-body">{course.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.isPublished 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-heading">
                          {course.studentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-heading">
                          {course.lessonCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          {formatDate(course.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-heading">
                          ${course.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(course.id, course)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                course.isPublished 
                                  ? 'bg-warning/10 text-warning hover:bg-warning/20' 
                                  : 'bg-success/10 text-success hover:bg-success/20'
                              }`}
                            >
                              {course.isPublished ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                  </svg>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleEditCourse(course.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleManageLessons(course.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                              </svg>
                              Lessons
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 mb-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="mx-1 px-4 py-2 rounded-lg bg-card text-primary hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium border border-border/10"
                  >
                    &laquo;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`mx-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        currentPage === i + 1
                          ? 'bg-primary text-white'
                          : 'bg-card text-primary hover:bg-secondary/10 border border-border/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="mx-1 px-4 py-2 rounded-lg bg-card text-primary hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium border border-border/10"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses; 