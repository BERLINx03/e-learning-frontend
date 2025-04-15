import React, { useState, useEffect } from 'react';
import { Lesson, CourseAPI } from '../../api/axios';
import LessonList from './LessonList';
import LessonView from './LessonView';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CourseContentProps {
  courseId: number;
  isEnrolled?: boolean;
  isInstructor?: boolean;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseId, isEnrolled: propIsEnrolled, isInstructor }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<{isEnrolled: boolean, progress: number} | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courseProgress, setCourseProgress] = useState<number>(0);

  const isEnrolled = propIsEnrolled !== undefined ? propIsEnrolled : hasAccess || enrollmentStatus?.isEnrolled || false;

  useEffect(() => {
    fetchLessons();
    if (user) {
      checkEnrollmentStatus();
      fetchCourseProgress();
    }
  }, [courseId, user]);

  const checkEnrollmentStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingEnrollment(true);
      const response = await CourseAPI.getCourseEnrollmentStatus(courseId);
      
      if (response.isSuccess) {
        setHasAccess(response.data || false);
        
        setEnrollmentStatus({
          isEnrolled: response.data || false,
          progress: response.data ? 0 : 0
        });
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await CourseAPI.getLessonsByCourseId(courseId);
      
      if (response.isSuccess && response.data) {
        setLessons(response.data);
        
        // Set the first lesson as active by default if there are lessons
        if (response.data.length > 0) {
          setActiveLesson(response.data[0]);
        }
      } else {
        setError(response.message || 'Failed to fetch lessons');
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('An error occurred while fetching lessons');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const response = await CourseAPI.getCourseProgress(courseId);
      if (response.isSuccess && response.data !== undefined) {
        setCourseProgress(response.data);
      }
    } catch (error) {
      console.error('Error fetching course progress:', error);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('You need to be logged in to enroll in a course');
      navigate('/auth/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await CourseAPI.enrollInCourse(courseId);
      
      if (response.isSuccess) {
        toast.success('Successfully enrolled in the course!');
        // Refresh the page to update all components after enrollment
        window.location.reload();
      } else {
        toast.error(response.message || 'Failed to enroll in the course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('An error occurred while enrolling in the course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!user) {
      toast.error('You need to be logged in to unenroll from a course');
      return;
    }

    // Confirm before unenrolling
    if (!window.confirm('Are you sure you want to unenroll from this course? Your progress may be lost.')) {
      return;
    }

    try {
      setEnrolling(true); // Reuse the same loading state
      const response = await CourseAPI.unenrollFromCourse(courseId);
      
      if (response.isSuccess) {
        toast.success('Successfully unenrolled from the course');
        // Redirect to my courses page after unenrolling
        navigate('/my-courses');
      } else {
        toast.error(response.message || 'Failed to unenroll from the course');
      }
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      toast.error('An error occurred while unenrolling from the course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonCompleted = () => {
    fetchLessons();
    checkEnrollmentStatus();
  };

  if (loading || checkingEnrollment) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={fetchLessons}
              className="mt-2 text-sm font-medium text-danger hover:text-red-900"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-warning">
              No lessons available for this course yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-color-primary">Course Content</h2>
                <span className="text-sm font-medium text-color-primary">
                  {Math.round(courseProgress)}% Complete
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
              <LessonList 
                lessons={lessons} 
                activeLessonId={activeLesson?.id || null}
                onLessonSelect={handleLessonSelect}
              />
            </div>
          </div>
          
          {isEnrolled && (
            <div className="mt-4">
              <button
                onClick={handleUnenroll}
                disabled={enrolling}
                className="w-full px-4 py-2 text-sm text-danger hover:text-white hover:bg-danger/90 font-medium flex items-center justify-center rounded-lg border-2 border-danger transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {enrolling ? 'Processing...' : 'Unenroll from course'}
              </button>
            </div>
          )}
        </div>

        {/* Lesson View - Right Side */}
        <div className="lg:col-span-2">
          {isEnrolled ? (
            <LessonView 
              lesson={activeLesson} 
              onLessonCompleted={() => {
                handleLessonCompleted();
                fetchCourseProgress();
              }}
            />
          ) : (
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-color-primary mb-2">Course Content Locked</h3>
                {isInstructor ? (
                  <p className="text-color-secondary text-center mb-6 max-w-md">
                    As the instructor, you should have automatic access to your course content. Please refresh the page or contact support if this issue persists.
                  </p>
                ) : (
                  <p className="text-color-secondary text-center mb-6 max-w-md">
                    You need to enroll in this course to access the lessons and course content.
                  </p>
                )}
                
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enrolling...
                    </span>
                  ) : 'Enroll Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContent; 