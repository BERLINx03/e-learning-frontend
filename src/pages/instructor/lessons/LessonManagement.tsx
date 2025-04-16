import React, { useState, useEffect, useRef } from 'react';
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
    documentUrl: '',
    order: 0,
    isQuiz: false
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      documentUrl: '',
      order: lessons.length + 1,
      isQuiz: false
    });
    setVideoFile(null);
    setIsCreating(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content || '',
      documentUrl: lesson.documentUrl || '',
      order: lesson.order + 1,
      isQuiz: lesson.isQuiz || false
    });
    setVideoFile(null);
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId) return;
    
    try {
      setIsSubmitting(true); // Start loading
      
      // Create the lesson data exactly as the backend expects
      const lessonData = {
        title: formData.title,
        description: formData.description,
        courseId: Number(courseId),
        documentUrl: formData.documentUrl || "",
        isQuiz: formData.isQuiz || false,
        order: formData.order - 1
      };
      
      let response;
      
      if (isCreating) {
        // Create new lesson
        response = await CourseAPI.createLesson(lessonData);
        if (response.isSuccess && response.data) {
          // If we have a video file, upload it
          if (videoFile) {
            try {
              const formData = new FormData();
              formData.append('video', videoFile);
              
              // Get the token from localStorage
              const token = localStorage.getItem('token');
              
              const videoResponse = await fetch(`https://localhost:7104/api/Lessons/${response.data.id}/video/course/${courseId}`, {
                method: 'PUT',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (videoResponse.ok) {
                const videoData = await videoResponse.text();
                if (videoData) {
                  try {
                    const parsedData = JSON.parse(videoData);
                    if (parsedData.isSuccess) {
                      toast.success('Video uploaded successfully!');
                    } else {
                      toast.error(parsedData.message || 'Failed to upload video');
                    }
                  } catch (e) {
                    // If response is not JSON, just show success if status was ok
                    toast.success('Video uploaded successfully!');
                  }
                } else {
                  toast.success('Video uploaded successfully!');
                }
              } else {
                if (videoResponse.status === 401) {
                  toast.error('Unauthorized. Please log in again.');
                } else {
                  const errorText = await videoResponse.text();
                  let errorMessage = 'Failed to upload video';
                  try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                  } catch (e) {
                    // If can't parse error response, use status text
                    errorMessage = videoResponse.statusText || errorMessage;
                  }
                  toast.error(errorMessage);
                }
              }
            } catch (error) {
              console.error('Error uploading video:', error);
              toast.error('Failed to upload video. Please try again.');
            }
          }
          toast.success(formData.isQuiz ? 'Quiz created successfully!' : 'Lesson created successfully!');
          setIsCreating(false);
        }
      } else if (selectedLesson) {
        // Update existing lesson
        response = await CourseAPI.updateLesson(selectedLesson.id, lessonData);
        if (response.isSuccess) {
          // If we have a new video file, upload it
          if (videoFile) {
            try {
              const formData = new FormData();
              formData.append('video', videoFile);
              
              // Get the token from localStorage
              const token = localStorage.getItem('token');
              
              const videoResponse = await fetch(`https://localhost:7104/api/Lessons/${selectedLesson.id}/video/course/${courseId}`, {
                method: 'PUT',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (videoResponse.ok) {
                const videoData = await videoResponse.text();
                if (videoData) {
                  try {
                    const parsedData = JSON.parse(videoData);
                    if (parsedData.isSuccess) {
                      toast.success('Video updated successfully!');
                    } else {
                      toast.error(parsedData.message || 'Failed to update video');
                    }
                  } catch (e) {
                    // If response is not JSON, just show success if status was ok
                    toast.success('Video updated successfully!');
                  }
                } else {
                  toast.success('Video updated successfully!');
                }
              } else {
                if (videoResponse.status === 401) {
                  toast.error('Unauthorized. Please log in again.');
                } else {
                  const errorText = await videoResponse.text();
                  let errorMessage = 'Failed to update video';
                  try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                  } catch (e) {
                    // If can't parse error response, use status text
                    errorMessage = videoResponse.statusText || errorMessage;
                  }
                  toast.error(errorMessage);
                }
              }
            } catch (error) {
              console.error('Error updating video:', error);
              toast.error('Failed to update video. Please try again.');
            }
          }
          toast.success('Lesson updated successfully!');
        }
      }
      
      // Refresh lessons
      fetchLessons();
      
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson. Please try again.');
    } finally {
      setIsSubmitting(false); // End loading
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
            Add Lesson
          </button>
          <button
            onClick={() => navigate(`/instructor/courses/${courseId}/quizzes/new`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Add Quiz
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
                      {lesson.videoUrl ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                          Video
                        </span>
                      ) : lesson.isQuiz ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                          Quiz
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
                {isCreating 
                  ? (formData.isQuiz ? 'Create New Quiz' : 'Create New Lesson') 
                  : selectedLesson 
                    ? (selectedLesson.isQuiz ? 'Edit Quiz' : 'Edit Lesson') 
                    : 'Lesson Details'}
              </h2>
            </div>
            {isCreating || selectedLesson ? (
              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          formData.isQuiz 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {formData.isQuiz ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Quiz
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Lesson
                            </>
                          )}
                        </span>
                        <p className="ml-3 text-sm text-color-secondary">
                          {formData.isQuiz 
                            ? 'This will be created as a quiz that students can take.' 
                            : 'This will be created as a regular lesson with content.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-color-primary mb-1">
                        {formData.isQuiz ? 'Quiz Title*' : 'Lesson Title*'}
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
                        {formData.isQuiz ? 'Quiz Description*' : 'Description*'}
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={formData.isQuiz ? "Enter quiz description" : "Enter lesson description"}
                      />
                    </div>

                    <div>
                      <label htmlFor="order" className="block text-sm font-medium text-color-primary mb-1">
                        {formData.isQuiz ? 'Quiz Order*' : 'Lesson Order*'}
                      </label>
                      <input
                        type="number"
                        name="order"
                        id="order"
                        required
                        min="1"
                        max={lessons.length + 1}
                        value={formData.order}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-color-secondary">
                        Order determines the position of this lesson in the course (1 is first)
                      </p>
                    </div>

                    {!formData.isQuiz && (
                      <>
                        <div>
                          <label htmlFor="video" className="block text-sm font-medium text-color-primary mb-1">
                            Video Upload
                          </label>
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="video"
                              ref={fileInputRef}
                              accept="video/mp4,video/webm"
                              onChange={handleVideoChange}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {videoFile ? 'Change Video' : 'Select Video'}
                            </button>
                            {videoFile && (
                              <span className="ml-3 text-sm text-color-secondary">
                                {videoFile.name}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-color-secondary">
                            Supported formats: MP4, WebM
                          </p>
                        </div>
                      </>
                    )}

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

                    {!formData.isQuiz && (
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
                    )}

                    <div className="flex justify-between">
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {selectedLesson ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            selectedLesson 
                              ? (formData.isQuiz ? 'Update Quiz' : 'Update Lesson')
                              : (formData.isQuiz ? 'Create Quiz' : 'Create Lesson')
                          )}
                        </button>
                        
                        {/* Add View Quiz button to edit quiz questions when a quiz is selected */}
                        {selectedLesson && selectedLesson.isQuiz && (
                          <button
                            type="button"
                            onClick={() => navigate(`/instructor/courses/${courseId}/quizzes/${selectedLesson.id}`)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ml-3"
                          >
                            <svg className="w-4 h-4 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Edit Quiz Questions
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLesson(null);
                            setIsCreating(false);
                          }}
                          disabled={isSubmitting}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                      {selectedLesson && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(selectedLesson.id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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