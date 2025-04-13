import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseAPI, Course } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface CourseWithEnrollmentStatus extends Course {
  hasAccess?: boolean;
  enrollmentStatus?: {
    isEnrolled: boolean;
    progress: number;
  };
}

const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithEnrollmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CourseAPI.getMyCourses();
      
      if (response.isSuccess && response.data) {
        console.log("Fetched courses:", response.data);
        // Log any issues with thumbnails
        response.data.forEach(course => {
          if (!course.thumbnailUrl || course.thumbnailUrl.length === 0) {
            console.warn(`Course "${course.title}" (ID: ${course.id}) has no thumbnail URL`);
          }
        });
        
        // Fetch enrollment status and access check for each course
        const coursesWithStatus = await Promise.all(
          response.data.map(async (course) => {
            try {
              // First get the traditional enrollment status (for progress)
              const statusResponse = await CourseAPI.getCourseEnrollmentStatus(course.id);
              
              // Check if the user has access to this course
              const courseWithAccess = {
                ...course,
                hasAccess: statusResponse.isSuccess ? statusResponse.data : false,
              };
              
              return courseWithAccess;
            } catch (error) {
              console.error(`Error fetching enrollment status for course ${course.id}:`, error);
              return {
                ...course,
                hasAccess: false
              };
            }
          })
        );
        
        setCourses(coursesWithStatus);
      } else {
        setError(response.message || 'Failed to fetch your courses');
        toast.error(response.message || 'Failed to fetch your courses');
      }
    } catch (error) {
      console.error('Error fetching your courses:', error);
      setError('An error occurred while fetching your courses');
      toast.error('An error occurred while fetching your courses');
    } finally {
      setLoading(false);
    }
  };

  // Generate a unique color for a course based on its title and ID
  const getCoursePlaceholderColor = (title: string, id: number) => {
    // List of vibrant background colors
    const bgColors = [
      'from-blue-500 to-blue-700',
      'from-purple-500 to-purple-700',
      'from-green-500 to-green-700',
      'from-yellow-500 to-yellow-700',
      'from-red-500 to-red-700',
      'from-pink-500 to-pink-700',
      'from-indigo-500 to-indigo-700',
      'from-teal-500 to-teal-700'
    ];
    
    // Create a simple hash from the title and id
    const hash = title.split('').reduce((acc, char, i) => 
      acc + char.charCodeAt(0) * (i + 1), 0) + id;
    
    // Use the hash to pick a color
    return bgColors[hash % bgColors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="bg-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-color-primary">My Courses</h1>
          <p className="mt-2 text-lg text-color-secondary">
            Continue learning where you left off
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchMyCourses}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-color-primary">No courses found</h3>
            <p className="mt-2 text-color-secondary">You haven't enrolled in any courses yet.</p>
            <div className="mt-6">
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-color-primary mb-6">
              Your Courses <span className="text-color-secondary">({courses.length})</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link 
                  key={course.id} 
                  to={`/courses/${course.id}`}
                  className="group block bg-card rounded-lg overflow-hidden border border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative pb-[56.25%] bg-secondary overflow-hidden">
                    {(() => {
                      // Debug log outside the JSX tree
                      console.log("Course thumbnail URL:", course.id, course.title, course.thumbnailUrl);
                      
                      if (course.thumbnailUrl && course.thumbnailUrl.length > 0) {
                        return (
                          <>
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title} 
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                // If image fails to load, replace with placeholder
                                console.error(`Failed to load thumbnail: ${course.thumbnailUrl}`);
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite callback loop
                                // Don't use a relative path, use absolute URL for placeholder
                                target.src = 'https://via.placeholder.com/640x360.png?text=Course+Image';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        );
                      } else {
                        return (
                          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getCoursePlaceholderColor(course.title, course.id)}`}>
                            <div className="text-center px-4">
                              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm mb-2">
                                <span className="text-2xl font-bold text-white">
                                  {course.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm line-clamp-2">
                                {course.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-100">
                                {course.category} • {course.level}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                    
                    {/* Access indicator */}
                    {course.hasAccess !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="h-1.5 bg-secondary">
                          <div 
                            className="h-1.5 bg-accent"
                            style={{ 
                              width: course.hasAccess ? '100%' : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-color-primary mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="text-sm text-color-secondary mb-3">
                      {course.category} • {course.level}
                    </div>
                    
                    {/* Access status */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center">
                        <svg className={`w-5 h-5 mr-2 ${course.hasAccess ? 'text-accent' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={course.hasAccess ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'} />
                        </svg>
                        <span className="text-sm font-medium text-color-primary">
                          {course.hasAccess ? 'Access Granted' : 'Access Required'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-primary">
                      <Link
                        to={
                          course.lessons && course.lessons.length > 0 && course.hasAccess
                            ? `/lessons/${course.lessons[0].id}`
                            : `/courses/${course.id}`
                        }
                        className="w-full block text-center px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
                      >
                        {course.hasAccess ? (
                          <>
                            <span>Continue Learning</span>
                            <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View Course</span>
                            <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses; 