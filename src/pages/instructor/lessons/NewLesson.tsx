import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseAPI } from '../../../api/axios';
import { toast } from 'react-hot-toast';

const NewLesson: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId) {
      toast.error('Course ID is missing');
      return;
    }
    
    try {
      setLoading(true);
      
      const lessonData = {
        ...formData,
        courseId: Number(courseId)
      };
      
      const response = await CourseAPI.createLesson(lessonData);
      
      if (response.isSuccess) {
        toast.success('Lesson created successfully!');
        navigate(`/instructor/courses/${courseId}/lessons`);
      } else {
        toast.error(response.message || 'Failed to create lesson');
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('An error occurred while creating the lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-color-primary">Create New Lesson</h1>
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
          className="mt-2 text-accent hover:text-accent-hover"
        >
          &larr; Back to Lessons
        </button>
      </div>
      
      <div className="bg-card shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-color-primary mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input text-color-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-color-primary mb-1">
              Short Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input text-color-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-color-primary mb-1">
              Lesson Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input text-color-primary"
              required
            />
            <p className="text-xs text-color-secondary mt-1">
              You can use Markdown formatting for rich content.
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="videoUrl" className="block text-sm font-medium text-color-primary mb-1">
              Video URL (optional)
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input text-color-primary"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="documentUrl" className="block text-sm font-medium text-color-primary mb-1">
              Document URL (optional)
            </label>
            <input
              type="url"
              id="documentUrl"
              name="documentUrl"
              value={formData.documentUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input text-color-primary"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isQuiz"
                name="isQuiz"
                checked={formData.isQuiz}
                onChange={handleInputChange}
                className="h-4 w-4 text-accent focus:ring-accent border-border rounded bg-input"
              />
              <label htmlFor="isQuiz" className="ml-2 block text-sm text-color-primary">
                This is a quiz lesson
              </label>
            </div>
            <p className="text-xs text-color-secondary mt-1">
              Quiz questions can be added after creating the lesson.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
              className="px-4 py-2 border border-border rounded-md text-color-primary bg-card hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLesson; 