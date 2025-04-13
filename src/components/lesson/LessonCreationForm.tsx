import React, { useState, useRef } from 'react';
import { Lesson, CourseAPI } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface LessonCreationFormProps {
  courseId: number;
  onSuccess?: (lesson: Lesson) => void;
  onCancel?: () => void;
}

const LessonCreationForm: React.FC<LessonCreationFormProps> = ({ 
  courseId, 
  onSuccess, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    documentUrl: '',
    isQuiz: false
  });

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
    
    if (!courseId) {
      toast.error('Course ID is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First create the lesson
      const lessonData = {
        ...formData,
        courseId: Number(courseId),
        order: 0, // This will be updated by the backend
      };
      
      const response = await CourseAPI.createLesson(lessonData);
      
      if (response.isSuccess && response.data) {
        toast.success('Lesson created successfully!');
        
        // If we have a video file, upload it
        if (videoFile && response.data.id) {
          const videoResponse = await CourseAPI.addLessonVideo(response.data.id, courseId, videoFile);
          
          if (videoResponse.isSuccess) {
            toast.success('Video uploaded successfully!');
          } else {
            toast.error(videoResponse.message || 'Failed to upload video');
          }
        }
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        toast.error(response.message || 'Failed to create lesson');
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('An error occurred while creating the lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm">
      <div className="p-4 bg-secondary border-b border-primary">
        <h2 className="text-lg font-medium text-color-primary">Create New Lesson</h2>
      </div>
      
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
                Supported formats: MP4, WebM. Maximum size: 500MB
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
                    Creating...
                  </>
                ) : 'Create Lesson'}
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonCreationForm; 