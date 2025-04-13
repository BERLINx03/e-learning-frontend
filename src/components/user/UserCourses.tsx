import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserAPI, CourseAPI, Enrollment, Course } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface UserCoursesProps {
  userId?: number;
  isOwnProfile?: boolean;
}

const UserCourses: React.FC<UserCoursesProps> = ({ userId, isOwnProfile = false }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOwnProfile) {
      fetchMyCourses();
    } else if (userId) {
      fetchUserEnrollments(userId);
    } else {
      setLoading(false);
    }
  }, [userId, isOwnProfile]);

  const fetchUserEnrollments = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await UserAPI.getUserEnrollments(id);
      
      if (response.isSuccess && response.data) {
        setEnrollments(response.data);
      } else {
        setError(response.message || 'Failed to fetch enrolled courses');
        toast.error(response.message || 'Failed to fetch enrolled courses');
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setError('An error occurred while fetching enrolled courses');
      toast.error('An error occurred while fetching enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching my courses...');
      const response = await CourseAPI.getMyCourses();
      console.log('Response from getMyCourses:', response);
      
      if (response.isSuccess && response.data) {
        setCourses(response.data);
      } else {
        // Fallback to user enrollments if the my-courses endpoint fails
        console.log('Falling back to getUserEnrollments due to error');
        const enrollmentsResponse = await UserAPI.getUserEnrollments();
        
        if (enrollmentsResponse.isSuccess && enrollmentsResponse.data) {
          setEnrollments(enrollmentsResponse.data);
          // Display error as a console warning but don't show to user since we have a fallback
          console.warn(response.message || 'Failed to fetch your courses, using enrollments instead');
        } else {
          setError(response.message || 'Failed to fetch your courses');
          toast.error(response.message || 'Failed to fetch your courses');
        }
      }
    } catch (error) {
      console.error('Error fetching your courses:', error);
      
      // Attempt fallback
      try {
        console.log('Falling back to getUserEnrollments due to exception');
        const enrollmentsResponse = await UserAPI.getUserEnrollments();
        
        if (enrollmentsResponse.isSuccess && enrollmentsResponse.data) {
          setEnrollments(enrollmentsResponse.data);
        } else {
          setError('An error occurred while fetching your courses');
          toast.error('An error occurred while fetching your courses');
        }
      } catch (fallbackError) {
        console.error('Error in fallback:', fallbackError);
        setError('An error occurred while fetching your courses');
        toast.error('An error occurred while fetching your courses');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
        <p>{error}</p>
        <button 
          onClick={isOwnProfile ? fetchMyCourses : () => userId && fetchUserEnrollments(userId)}
          className="mt-2 text-sm underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  // Determine if we have data to show
  const hasData = isOwnProfile 
    ? (courses.length > 0 || enrollments.length > 0) 
    : enrollments.length > 0;

  if (!hasData) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border border-primary">
        <svg className="mx-auto h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-color-primary">
          {isOwnProfile ? "You're not enrolled in any courses yet" : "This user isn't enrolled in any courses yet"}
        </h3>
        {isOwnProfile && (
          <p className="mt-1 text-color-secondary">
            Explore our course catalog to find something that interests you.
          </p>
        )}
        {isOwnProfile && (
          <div className="mt-6">
            <Link
              to="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Count items to display
  const itemCount = isOwnProfile 
    ? (courses.length > 0 ? courses.length : enrollments.length)
    : enrollments.length;

  return (
    <div className="bg-card rounded-lg border border-primary overflow-hidden">
      <div className="p-4 bg-secondary border-b border-primary">
        <h2 className="text-lg font-medium text-color-primary">
          {isOwnProfile ? 'Your Courses' : 'Enrolled Courses'}
          <span className="ml-2 text-sm text-color-secondary">
            ({itemCount})
          </span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {isOwnProfile && courses.length > 0 ? (
          // Render my courses directly from the courses array if available
          courses.map((course) => (
            <Link 
              key={course.id} 
              to={`/courses/${course.id}`}
              className="block bg-primary rounded-lg overflow-hidden border border-primary hover:shadow-md transition-shadow"
            >
              <div className="relative pb-[56.25%] bg-secondary">
                {course.thumbnailUrl ? (
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Progress indicator */}
                {course.enrollments && course.enrollments[0] && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <div className="h-1 bg-secondary">
                      <div 
                        className="h-1 bg-accent"
                        style={{ 
                          width: `${Math.round(
                            (course.enrollments[0].progress.filter(p => p.isCompleted).length / 
                            (course.lessons?.length || 1)) * 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-color-primary mb-1 line-clamp-2">
                  {course.title}
                </h3>
                <div className="text-xs text-color-secondary mb-2">
                  {course.category} • {course.level}
                </div>
                
                {/* Progress text - if there's enrollment data */}
                {course.enrollments && course.enrollments[0] && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-color-secondary">
                      {course.enrollments[0].isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                    <span className="text-color-secondary">
                      {Math.round(
                        (course.enrollments[0].progress.filter(p => p.isCompleted).length / 
                        (course.lessons?.length || 1)) * 100
                      )}%
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          // Render enrollments (either other user's or fallback for own profile)
          enrollments.map((enrollment) => (
            <Link 
              key={enrollment.id} 
              to={`/courses/${enrollment.courseId}`}
              className="block bg-primary rounded-lg overflow-hidden border border-primary hover:shadow-md transition-shadow"
            >
              <div className="relative pb-[56.25%] bg-secondary">
                {enrollment.course?.thumbnailUrl ? (
                  <img 
                    src={enrollment.course.thumbnailUrl} 
                    alt={enrollment.course.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1 bg-secondary">
                    <div 
                      className="h-1 bg-accent"
                      style={{ 
                        width: `${Math.round(
                          (enrollment.progress.filter(p => p.isCompleted).length / 
                          (enrollment.course?.lessons?.length || 1)) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-color-primary mb-1 line-clamp-2">
                  {enrollment.course?.title}
                </h3>
                <div className="text-xs text-color-secondary mb-2">
                  {enrollment.course?.category} • {enrollment.course?.level}
                </div>
                
                {/* Progress text */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-color-secondary">
                    {enrollment.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                  <span className="text-color-secondary">
                    {Math.round(
                      (enrollment.progress.filter(p => p.isCompleted).length / 
                      (enrollment.course?.lessons?.length || 1)) * 100
                    )}%
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default UserCourses; 