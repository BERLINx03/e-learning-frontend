import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CourseAPI, Lesson, Progress } from '../../api/axios';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import LessonList from '../../components/lesson/LessonList';

const LessonDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<Progress | null>(null);
  const [courseProgress, setCourseProgress] = useState<number>(0);

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
        
        // Check lesson progress
        await fetchLessonProgress(lessonId);
        
        // If the lesson belongs to a course, fetch course lessons and progress
        if (response.data.courseId) {
          await fetchCourseLessons(response.data.courseId, lessonId);
          await fetchCourseProgress(response.data.courseId);
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

  const fetchLessonProgress = async (lessonId: number) => {
    try {
      const progressResponse = await CourseAPI.getLessonProgress(lessonId);
      if (progressResponse.isSuccess && progressResponse.data) {
        setLessonProgress(progressResponse.data);
      }
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    }
  };

  const fetchCourseProgress = async (courseId: number) => {
    try {
      const progressResponse = await CourseAPI.getCourseProgress(courseId);
      if (progressResponse.isSuccess && progressResponse.data !== undefined) {
        setCourseProgress(progressResponse.data);
      }
    } catch (error) {
      console.error('Error fetching course progress:', error);
    }
  };

  const fetchCourseLessons = async (courseId: number, currentLessonId: number) => {
    try {
      const lessonsResponse = await CourseAPI.getLessonsByCourseId(courseId);
      
      if (lessonsResponse.isSuccess && lessonsResponse.data) {
        const sortedLessons = lessonsResponse.data.sort((a, b) => a.order - b.order);
        setCourseLessons(sortedLessons);
        
        const currentIndex = sortedLessons.findIndex(l => l.id === currentLessonId);
        if (currentIndex !== -1) {
          setPrevLesson(currentIndex > 0 ? sortedLessons[currentIndex - 1] : null);
          setNextLesson(currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null);
        }
      }
    } catch (error) {
      console.error('Error fetching course lessons:', error);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!lesson) return;
    
    try {
      setIsCompleting(true);
      const response = await CourseAPI.markLessonAsCompleted(lesson.id);
      
      if (response.isSuccess) {
        toast.success(response.message || 'Lesson marked as completed!');
        
        // Update lesson progress
        await fetchLessonProgress(lesson.id);
        
        // Update course progress
        if (lesson.courseId) {
          await fetchCourseProgress(lesson.courseId);
        }
        
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

  const isLessonCompleted = lessonProgress?.isCompleted;

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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Left Side */}
          <div className="flex-1">
            {/* Course Navigation and Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Link 
                  to={`/courses/${lesson?.courseId}`}
                  className="text-accent hover:text-accent-hover flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Course
                </Link>
                
                <div className="text-sm text-color-secondary">
                  Course Progress: {Math.round(courseProgress)}%
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Lesson Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-color-primary">{lesson?.title}</h1>
                <button
                  onClick={handleMarkAsComplete}
                  disabled={isCompleting || isLessonCompleted}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isLessonCompleted
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : isCompleting
                      ? 'bg-accent/50 text-white cursor-wait'
                      : 'bg-accent hover:bg-accent-hover text-white'
                  }`}
                >
                  {isLessonCompleted ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                      {lessonProgress?.completedAt && (
                        <span className="ml-1 text-xs">
                          ({new Date(lessonProgress.completedAt).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  ) : isCompleting ? (
                    'Completing...'
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              </div>
            </div>
            
            {/* Lesson Content */}
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              {/* Video Content */}
              {lesson?.videoUrl && (
                <div className="mb-6">
                  <div className="relative pb-[56.25%] bg-black rounded-t-lg overflow-hidden">
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

              <div className="p-6">
                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-color-primary mb-2">Description</h2>
                  <p className="text-color-secondary">{lesson?.description}</p>
                </div>

                {/* Document Content */}
                {lesson?.documentUrl && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-color-primary mb-2">Supplementary Material</h2>
                    <div className="border border-primary rounded-lg p-4 bg-secondary hover:bg-opacity-75 transition-colors">
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
                {lesson?.content && (
                  <div>
                    <h2 className="text-lg font-semibold text-color-primary mb-2">Lesson Content</h2>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{lesson.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between px-6 py-4 bg-secondary border-t border-primary">
                <button
                  onClick={() => prevLesson && navigate(`/lessons/${prevLesson.id}`)}
                  disabled={!prevLesson}
                  className={`flex items-center text-sm ${prevLesson ? 'text-accent hover:text-accent-hover' : 'text-color-disabled cursor-not-allowed'}`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous Lesson
                </button>
                
                <button
                  onClick={() => nextLesson && navigate(`/lessons/${nextLesson.id}`)}
                  disabled={!nextLesson}
                  className={`flex items-center text-sm ${nextLesson ? 'text-accent hover:text-accent-hover' : 'text-color-disabled cursor-not-allowed'}`}
                >
                  Next Lesson
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Lesson List - Right Side */}
          <div className="w-full lg:w-1/4">
            <div className="bg-card rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-4 border-b border-border">Course Content</h2>
              <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
                <LessonList
                  lessons={courseLessons}
                  activeLessonId={lesson?.id || null}
                  onLessonSelect={(selectedLesson) => {
                    navigate(`/lessons/${selectedLesson.id}`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetails; 