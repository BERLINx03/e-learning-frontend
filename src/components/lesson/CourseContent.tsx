import React, { useState, useEffect } from 'react';
import { Lesson, CourseAPI } from '../../api/axios';
import LessonList from './LessonList';
import LessonView from './LessonView';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CourseContentProps {
  courseId: number;
  isEnrolled: boolean;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseId, isEnrolled }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

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
        window.location.reload(); // Refresh the page to update enrollment status
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

  const handleLessonCompleted = () => {
    fetchLessons(); // Refresh lessons to update progress
  };

  if (loading) {
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
      <h2 className="text-2xl font-bold text-color-primary mb-6">Course Content</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LessonList 
            lessons={lessons} 
            activeLessonId={activeLesson?.id || null}
            onLessonSelect={handleLessonSelect}
          />
        </div>
        <div className="lg:col-span-2">
          {isEnrolled ? (
            <LessonView 
              lesson={activeLesson} 
              onLessonCompleted={handleLessonCompleted}
            />
          ) : (
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <svg className="w-16 h-16 text-warning mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-semibold text-color-primary mb-2">Course Content Locked</h3>
                <p className="text-color-secondary text-center mb-6 max-w-md">
                  You need to enroll in this course to access the lessons and course content.
                </p>
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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