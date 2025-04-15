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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    documentUrl: '',
    order: 1
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
      
      // Create the lesson data exactly as the backend expects
      const lessonData = {
        title: formData.title,
        description: formData.description,
        courseId: Number(courseId),
        documentUrl: formData.documentUrl || "", // Ensure we send empty string if no URL
        isQuiz: false, // We'll handle quiz creation later
        order: formData.order - 1 // Convert to 0-based for backend
      };
      
      console.log('Sending lesson data:', JSON.stringify(lessonData));
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Try using fetch directly for better debugging
      const lessonResponse = await fetch('https://localhost:7104/api/Lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, text/plain'
        },
        body: JSON.stringify(lessonData)
      });
      
      console.log('Lesson creation response status:', lessonResponse.status);
      console.log('Lesson creation response status text:', lessonResponse.statusText);
      
      if (lessonResponse.ok) {
        const responseData = await lessonResponse.json();
        console.log('Lesson creation response data:', responseData);
        
        if (responseData.isSuccess && responseData.data) {
          // If we have a video file, upload it
          if (videoFile && responseData.data.id) {
            try {
              setUploadingVideo(true);
              console.log(`Uploading video for lesson ID ${responseData.data.id} in course ${courseId}`);
              
              // Use FormData directly to have more control
              const formData = new FormData();
              formData.append('video', videoFile);
              formData.append('file', videoFile);
              
              // Use fetch directly to have more control over the request
              const videoResponse = await fetch(`https://localhost:7104/api/Lessons/${responseData.data.id}/video/course/${courseId}`, {
                method: 'PUT',
                body: formData,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              console.log('Video upload status:', videoResponse.status);
              console.log('Video upload status text:', videoResponse.statusText);
              
              if (videoResponse.ok) {
                const videoData = await videoResponse.text();
                console.log('Video upload response text:', videoData);
                
                // Try to parse but don't fail if it's not JSON
                try {
                  const parsedData = JSON.parse(videoData);
                  if (parsedData.isSuccess !== false) {
                    toast.success('Video uploaded successfully!');
                  } else {
                    toast.error(parsedData.message || 'Failed to upload video');
                  }
                } catch (e) {
                  // If response is not JSON, but status is OK, consider it success
                  if (videoResponse.ok) {
                    toast.success('Video uploaded successfully!');
                  } else {
                    toast.error('Failed to upload video');
                  }
                }
              } else {
                let errorMessage = 'Failed to upload video';
                
                if (videoResponse.status === 401) {
                  errorMessage = 'Unauthorized. Please log in again.';
                } else if (videoResponse.status === 404) {
                  errorMessage = 'Video upload endpoint not found. Check API URL.';
                } else {
                  try {
                    const errorText = await videoResponse.text();
                    console.error('Video upload error response:', errorText);
                    
                    try {
                      const errorData = JSON.parse(errorText);
                      errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                      // If can't parse error response, use status text
                      errorMessage = videoResponse.statusText || errorMessage;
                    }
                  } catch (e) {
                    console.error('Failed to read error response:', e);
                  }
                }
                
                toast.error(errorMessage);
                console.error('Video upload failed:', errorMessage);
              }
            } catch (error) {
              console.error('Error uploading video:', error);
              toast.error('Failed to upload video. Please try again.');
            } finally {
              setUploadingVideo(false);
            }
          }
          
          toast.success('Lesson created successfully!');
          if (onSuccess) {
            onSuccess(responseData.data);
          }
        } else {
          toast.error(responseData.message || 'Failed to create lesson');
        }
      } else {
        // Handle error response
        let errorMessage = 'Failed to create lesson';
        
        try {
          const errorText = await lessonResponse.text();
          console.error('Lesson creation error response:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If can't parse error response, use status text
            errorMessage = lessonResponse.statusText || errorMessage;
          }
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
        
        toast.error(errorMessage);
        console.error('Lesson creation failed:', errorMessage);
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
              <label htmlFor="order" className="block text-sm font-medium text-color-primary mb-1">
                Lesson Order*
              </label>
              <input
                type="number"
                name="order"
                id="order"
                required
                min="1"
                value={formData.order}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-color-secondary">
                Order determines the position of this lesson in the course (1 is first)
              </p>
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
                Supported formats: MP4, WebM
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
                    {uploadingVideo ? 'Uploading Video...' : 'Creating Lesson...'}
                  </>
                ) : 'Create Lesson'}
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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