import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CourseAPI, Lesson } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LessonDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [previousLesson, setPreviousLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (id) {
      fetchLessonDetails(parseInt(id));
    }
  }, [id]);

  const fetchLessonDetails = async (lessonId: number) => {
    try {
      setLoading(true);
      const response = await CourseAPI.getLessonById(lessonId);
      
      if (response.isSuccess && response.data) {
        setLesson(response.data);
        
        // Fetch all lessons for this course to determine previous and next lessons
        const allLessonsResponse = await CourseAPI.getLessonsByCourseId(response.data.courseId);
        
        if (allLessonsResponse.isSuccess && allLessonsResponse.data) {
          const sortedLessons = allLessonsResponse.data.sort((a, b) => a.order - b.order);
          const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
          
          if (currentIndex > 0) {
            setPreviousLesson(sortedLessons[currentIndex - 1]);
          } else {
            setPreviousLesson(null);
          }
          
          if (currentIndex < sortedLessons.length - 1) {
            setNextLesson(sortedLessons[currentIndex + 1]);
          } else {
            setNextLesson(null);
          }
        }
      } else {
        setError(response.message || 'Failed to fetch lesson details');
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      setError('An error occurred while fetching lesson details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!lesson) return;
    
    try {
      setIsCompleting(true);
      const response = await CourseAPI.markLessonAsCompleted(lesson.id);
      
      if (response.isSuccess) {
        toast.success('Lesson marked as completed!');
        // Refresh lesson data to update progress state
        fetchLessonDetails(lesson.id);
        
        // Auto-advance to next lesson if available
        if (nextLesson) {
          navigate(`/lessons/${nextLesson.id}`);
        }
      } else {
        toast.error(response.message || 'Failed to mark lesson as completed');
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error('An error occurred while marking lesson as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  const isLessonCompleted = lesson?.progress && lesson.progress.some(p => p.isCompleted);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error || 'Lesson not found'}</p>
              <Link to="/courses" className="mt-2 text-sm font-medium text-red-800 hover:text-red-900">
                Go to Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb and navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center text-sm text-color-secondary">
          <Link to="/courses" className="hover:text-color-accent">Courses</Link>
          <svg className="mx-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/courses/${lesson.courseId}`} className="hover:text-color-accent">Course</Link>
          <svg className="mx-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-color-primary">Lesson {lesson.order + 1}</span>
        </div>

        <div className="flex space-x-2">
          {previousLesson && (
            <Link 
              to={`/lessons/${previousLesson.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>
          )}
          
          {nextLesson && (
            <Link 
              to={`/lessons/${nextLesson.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-primary">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-color-primary">{lesson.title}</h1>
              <p className="mt-2 text-color-secondary">{lesson.description}</p>
            </div>
            {isLessonCompleted ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-success bg-green-100">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </div>
            ) : (
              <button
                onClick={handleMarkAsComplete}
                disabled={isCompleting}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Complete
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {/* Video Content */}
          {lesson.videoUrl && (
            <div className="mb-8">
              <h2 className="text-xl font-medium text-color-primary mb-4">Video Lesson</h2>
              <div className="relative pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <video 
                  className="absolute inset-0 w-full h-full object-contain"
                  controls
                  src={lesson.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Document Content */}
          {lesson.documentUrl && (
            <div className="mb-8">
              <h2 className="text-xl font-medium text-color-primary mb-4">Supplementary Material</h2>
              <div className="border border-primary rounded-lg p-4 bg-secondary">
                <a 
                  href={lesson.documentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-color-accent hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Document
                </a>
              </div>
            </div>
          )}

          {/* Quiz Content */}
          {lesson.isQuiz && lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-medium text-color-primary mb-4">Quiz</h2>
              <div className="border border-primary rounded-lg p-6 bg-secondary">
                <p className="text-color-secondary mb-4">This lesson contains a quiz with {lesson.quizQuestions.length} questions. Complete it to test your knowledge.</p>
                <button
                  onClick={() => toast.success('Quiz feature coming soon!')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* Text Content */}
          {lesson.content && (
            <div className="mb-8">
              <h2 className="text-xl font-medium text-color-primary mb-4">Lesson Content</h2>
              <div className="prose prose-blue max-w-none text-color-primary">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons at bottom */}
        <div className="p-6 border-t border-primary bg-secondary flex justify-between">
          <div>
            {previousLesson && (
              <Link 
                to={`/lessons/${previousLesson.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous: {previousLesson.title}
              </Link>
            )}
          </div>
          
          <div>
            {nextLesson && (
              <Link 
                to={`/lessons/${nextLesson.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next: {nextLesson.title}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetails; 