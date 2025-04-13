import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseAPI, Lesson } from '../../../api/axios';
import { toast } from 'react-hot-toast';

const LessonManagement: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);

  // Form state for creating/editing lessons
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    documentUrl: '',
    isQuiz: false
  });

  useEffect(() => {
    fetchLessons();
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      if (!courseId) return;
      
      const response = await CourseAPI.getCourseById(Number(courseId));
      if (response.isSuccess && response.data) {
        setCourseTitle(response.data.title);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      if (!courseId) return;
      
      const response = await CourseAPI.getLessonsByCourseId(Number(courseId));
      
      if (response.isSuccess && response.data) {
        // Sort lessons by order property
        const sortedLessons = response.data.sort((a, b) => a.order - b.order);
        setLessons(sortedLessons);
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

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      documentUrl: '',
      isQuiz: false
    });
    setIsCreating(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      documentUrl: lesson.documentUrl || '',
      isQuiz: lesson.isQuiz
    });
    setIsCreating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId) return;
    
    try {
      const lessonData = {
        ...formData,
        courseId: Number(courseId),
        order: isCreating ? lessons.length : selectedLesson?.order || 0
      };
      
      let response;
      
      if (isCreating) {
        // Create new lesson
        response = await CourseAPI.createLesson(lessonData);
        if (response.isSuccess) {
          toast.success('Lesson created successfully!');
          setIsCreating(false);
        }
      } else if (selectedLesson) {
        // Update existing lesson
        response = await CourseAPI.updateLesson(selectedLesson.id, lessonData);
        if (response.isSuccess) {
          toast.success('Lesson updated successfully!');
        }
      }
      
      // Refresh lessons
      fetchLessons();
      
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson. Please try again.');
    }
  };

  const handleDragStart = (lesson: Lesson) => {
    setIsDragging(true);
    setDraggedLesson(lesson);
  };

  const handleDragOver = (e: React.DragEvent, targetLesson: Lesson) => {
    e.preventDefault();
    if (!draggedLesson || draggedLesson.id === targetLesson.id) return;
  };

  const handleDrop = async (e: React.DragEvent, targetLesson: Lesson) => {
    e.preventDefault();
    if (!draggedLesson || draggedLesson.id === targetLesson.id) return;
    
    // Get current orders
    const draggedOrder = draggedLesson.order;
    const targetOrder = targetLesson.order;
    
    // Create a new array with updated orders
    const updatedLessons = lessons.map(lesson => {
      if (lesson.id === draggedLesson.id) {
        return { ...lesson, order: targetOrder };
      }
      if (lesson.id === targetLesson.id) {
        return { ...lesson, order: draggedOrder };
      }
      return lesson;
    });
    
    // Update state
    setLessons(updatedLessons.sort((a, b) => a.order - b.order));
    setIsDragging(false);
    setDraggedLesson(null);
    
    // Update orders in the backend
    try {
      await Promise.all([
        CourseAPI.updateLessonOrder(draggedLesson.id, targetOrder),
        CourseAPI.updateLessonOrder(targetLesson.id, draggedOrder)
      ]);
      toast.success('Lesson order updated');
    } catch (error) {
      console.error('Error updating lesson order:', error);
      toast.error('Failed to update lesson order');
      // Revert to original order
      fetchLessons();
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await CourseAPI.deleteLesson(lessonId);
      
      if (response.isSuccess) {
        toast.success('Lesson deleted successfully');
        fetchLessons();
        if (selectedLesson?.id === lessonId) {
          setSelectedLesson(null);
          setIsCreating(false);
        }
      } else {
        toast.error(response.message || 'Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('An error occurred while deleting the lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchLessons}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-color-primary">Manage Lessons</h1>
          <p className="text-color-secondary mt-1">Course: {courseTitle}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(`/instructor/courses`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Courses
          </button>
          <button
            onClick={handleCreateLesson}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Lesson
          </button>
          <button
            onClick={() => navigate(`/instructor/courses/${courseId}/lessons/new`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Create Video Lesson
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lesson List */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-secondary border-b border-primary">
            <h2 className="text-lg font-medium text-color-primary">Lesson Content</h2>
            <p className="text-sm text-color-secondary mt-1">Drag to reorder lessons</p>
          </div>
          <ul className="divide-y divide-primary">
            {lessons.length === 0 ? (
              <li className="p-4 text-color-secondary">
                No lessons found. Create your first lesson to get started.
              </li>
            ) : (
              lessons.map(lesson => (
                <li
                  key={lesson.id}
                  draggable
                  onDragStart={() => handleDragStart(lesson)}
                  onDragOver={(e) => handleDragOver(e, lesson)}
                  onDrop={(e) => handleDrop(e, lesson)}
                  onClick={() => handleEditLesson(lesson)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedLesson?.id === lesson.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-secondary'
                  } ${isDragging ? 'cursor-move' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-color-primary mr-3">
                        {lesson.order + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-color-primary">{lesson.title}</h3>
                        <p className="text-xs text-color-secondary mt-1 truncate">{lesson.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {lesson.isQuiz ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                          Quiz
                        </span>
                      ) : lesson.videoUrl ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                          Video
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          Text
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Lesson Editor */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-sm">
            <div className="p-4 bg-secondary border-b border-primary">
              <h2 className="text-lg font-medium text-color-primary">
                {isCreating ? 'Create New Lesson' : selectedLesson ? 'Edit Lesson' : 'Lesson Details'}
              </h2>
            </div>
            {isCreating || selectedLesson ? (
              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-color-primary mb-1">
                        Lesson Title*
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter lesson title"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-color-primary mb-1">
                        Description*
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter lesson description"
                      />
                    </div>

                    <div>
                      <label htmlFor="videoUrl" className="block text-sm font-medium text-color-primary mb-1">
                        Video URL (optional)
                      </label>
                      <input
                        type="url"
                        name="videoUrl"
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://example.com/video.mp4"
                      />
                      <p className="mt-1 text-sm text-color-secondary">
                        Enter a direct link to your video file (MP4, WebM)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="documentUrl" className="block text-sm font-medium text-color-primary mb-1">
                        Document URL (optional)
                      </label>
                      <input
                        type="url"
                        name="documentUrl"
                        id="documentUrl"
                        value={formData.documentUrl}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://example.com/document.pdf"
                      />
                      <p className="mt-1 text-sm text-color-secondary">
                        Enter a direct link to supplementary materials (PDF, DOCX)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-color-primary mb-1">
                        Lesson Content (optional)
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        rows={6}
                        value={formData.content}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter lesson content in HTML format"
                      />
                      <p className="mt-1 text-sm text-color-secondary">
                        You can use HTML to format your content
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isQuiz"
                        id="isQuiz"
                        checked={formData.isQuiz}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isQuiz" className="ml-2 block text-sm text-color-primary">
                        This is a quiz
                      </label>
                    </div>

                    <div className="flex justify-between">
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {selectedLesson ? 'Update Lesson' : 'Create Lesson'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLesson(null);
                            setIsCreating(false);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                      </div>
                      {selectedLesson && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(selectedLesson.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="w-4 h-4 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-color-secondary text-lg text-center">
                  Select a lesson to edit or create a new one to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonManagement; 