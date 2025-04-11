import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../api/axios';

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  thumbnailUrl: string;
  isPublished: boolean;
}

interface ApiResponse {
  isSuccess: boolean;
  message: string;
  errors?: string[];
  data?: any;
  statusCode: number;
}

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Design',
  'Business',
  'Marketing',
  'Photography',
  'Music',
  'Other'
];

const LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels'
];

const CourseForm: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const isEditMode = !!courseId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: CATEGORIES[0],
    level: LEVELS[0],
    price: 0,
    thumbnailUrl: '',
    isPublished: false
  });

  useEffect(() => {
    // If in edit mode, fetch the course data
    if (isEditMode) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const response = await API.get<ApiResponse>(`/api/Courses/${courseId}`);
      
      if (response.data.isSuccess && response.data.data) {
        const course = response.data.data;
        
        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          thumbnailUrl: course.thumbnailUrl || '',
          isPublished: course.isPublished
        });
      } else {
        setError(response.data.message || 'Failed to load course data.');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setError('Failed to load course data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        isPublished: value === 'published'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setValidationErrors([]);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: formData.price,
        thumbnailUrl: formData.thumbnailUrl,
        instructorId: user?.id
      };

      let response;
      
      if (isEditMode) {
        // Update existing course
        response = await API.put<ApiResponse>(`/api/Courses/${courseId}`, {
          ...payload,
          isPublished: formData.isPublished
        });
      } else {
        // Create new course
        response = await API.post<ApiResponse>('/api/Courses', payload);
      }

      // Check response status
      if (response.data.isSuccess) {
        // Redirect back to course list
        navigate('/instructor-dashboard');
        setActiveTab('courses'); // Set the active tab to courses
      } else {
        // Handle API error response
        setError(response.data.message || 'Failed to save course.');
        
        if (response.data.errors && response.data.errors.length > 0) {
          setValidationErrors(response.data.errors);
        }
      }
    } catch (error: any) {
      console.error('Failed to save course:', error);
      
      // Try to extract error from response if available
      if (error.response?.data?.message) {
        setError(error.response.data.message);
        
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          setValidationErrors(error.response.data.errors);
        }
      } else {
        setError('Failed to save course. Please check your inputs and try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setActiveTab = (tab: string) => {
    // This function is used to set the active tab in the parent component
    // It's a workaround since we don't have direct access to the parent's state
    const event = new CustomEvent('setActiveTab', { detail: tab });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Course' : 'Create New Course'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode 
            ? 'Update your course information below' 
            : 'Fill in the details below to create a new course'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              placeholder="e.g. Introduction to React Development"
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.title}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-gray-500">Choose a clear, descriptive title for your course</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              id="description"
              rows={5}
              required
              placeholder="Provide a detailed description of your course..."
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.description}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-gray-500">Describe what students will learn in this course</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              id="category"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.category}
              onChange={handleInputChange}
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Select the category that best fits your course</p>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              name="level"
              id="level"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.level}
              onChange={handleInputChange}
            >
              {LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Indicate the skill level required for this course</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="price"
                id="price"
                min="0"
                step="0.01"
                required
                className="block w-full pl-7 pr-12 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="0.00"
                value={formData.price}
                onChange={handleInputChange}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">USD</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Set to 0 for a free course</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.isPublished ? 'published' : 'draft'}
              onChange={handleInputChange}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.isPublished 
                ? 'Course will be visible to students' 
                : 'Course will be saved as a draft and hidden from students'
              }
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700">
            Course Image URL
          </label>
          <input
            type="url"
            name="thumbnailUrl"
            id="thumbnailUrl"
            className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
            value={formData.thumbnailUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
          <p className="mt-1 text-xs text-gray-500">
            Provide a URL for your course thumbnail image. Leave empty to use a default image.
          </p>
        </div>

        {formData.thumbnailUrl && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Preview</label>
            <div className="flex justify-center">
              <img 
                src={formData.thumbnailUrl} 
                alt="Course preview" 
                className="h-48 object-cover rounded-md border border-gray-300 shadow-sm"
                onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/instructor-dashboard')}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              `${isEditMode ? 'Update' : 'Create'} Course`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm; 