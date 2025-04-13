import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CourseAPI, Lesson } from '../../api/axios';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const LessonDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLesson(Number(id));
    }
  }, [id]);

  const fetchLesson = async (lessonId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CourseAPI.getLessonById(lessonId);
      
      if (response.isSuccess && response.data) {
        setLesson(response.data);
        
        // If the lesson belongs to a course, fetch the course to get other lessons
        if (response.data.courseId) {
          const courseResponse = await CourseAPI.getCourseById(response.data.courseId);
          
          if (courseResponse.isSuccess && courseResponse.data && courseResponse.data.lessons) {
            const sortedLessons = courseResponse.data.lessons.sort((a, b) => a.order - b.order);
            const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
            
            if (currentIndex !== -1) {
              setPrevLesson(currentIndex > 0 ? sortedLessons[currentIndex - 1] : null);
              setNextLesson(currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null);
            }
          }
        }
      } else {
        setError(response.message || 'Failed to fetch lesson');
        toast.error(response.message || 'Failed to fetch lesson');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('An error occurred while fetching the lesson');
      toast.error('An error occurred while fetching the lesson');
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
        
        // Refresh the lesson to update the progress
        fetchLesson(lesson.id);
        
        // Auto-navigate to next lesson if available
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
      <div className="min-h-screen bg-primary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-primary p-4">
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-card rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-color-primary mb-4">Error</h2>
          <p className="text-color-secondary mb-6">{error || 'Lesson not found'}</p>
          <Link 
            to="/my-courses" 
            className="text-accent hover:text-accent-hover"
          >
            &larr; Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Course Navigation */}
        <div className="flex items-center mb-6">
          <Link 
            to={`/courses/${lesson.courseId}`}
            className="text-accent hover:text-accent-hover"
          >
            &larr; Back to Course
          </Link>
          
          <span className="mx-2 text-color-secondary">|</span>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => prevLesson && navigate(`/lessons/${prevLesson.id}`)}
              disabled={!prevLesson}
              className={`flex items-center text-sm ${prevLesson ? 'text-accent hover:text-accent-hover' : 'text-color-disabled cursor-not-allowed'}`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <button
              onClick={() => nextLesson && navigate(`/lessons/${nextLesson.id}`)}
              disabled={!nextLesson}
              className={`flex items-center text-sm ${nextLesson ? 'text-accent hover:text-accent-hover' : 'text-color-disabled cursor-not-allowed'}`}
            >
              Next
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Lesson Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-color-primary mb-2">{lesson.title}</h1>
          <p className="text-color-secondary">{lesson.description}</p>
        </div>
        
        {/* Lesson Content */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
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
                    className="flex items-center text-accent hover:text-accent-hover"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Document
                  </a>
                </div>
              </div>
            )}

            {/* Text Content */}
            {lesson.content && (
              <div className="prose dark:prose-invert prose-blue max-w-none">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              </div>
            )}

            {/* Completion Actions */}
            <div className="mt-8 pt-6 border-t border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isLessonCompleted ? (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkAsComplete}
                      disabled={isCompleting}
                      className="flex items-center px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50"
                    >
                      {isCompleting ? 'Marking...' : 'Mark as Completed'}
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {nextLesson && (
                  <button
                    onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                    className="flex items-center px-4 py-2 bg-secondary text-color-primary rounded-md hover:bg-secondary-hover"
                  >
                    Next Lesson
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetails; 