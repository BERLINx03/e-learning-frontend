import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API, { CourseAPI, Course, ApiResponse } from '../../api/axios';

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  whatYouWillLearn: string[];
  thisCourseInclude: string[];
  duration: number;
  price: number;
  thumbnailUrl: string;
  isPublished: boolean;
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

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Other'
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
    language: LANGUAGES[0],
    whatYouWillLearn: [''],
    thisCourseInclude: [''],
    duration: 0,
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
      const response = await CourseAPI.getCourseById(Number(courseId));
      
      if (response.isSuccess && response.data) {
        const course = response.data;
        
        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          language: course.language,
          whatYouWillLearn: course.whatYouWillLearn,
          thisCourseInclude: course.thisCourseInclude,
          duration: course.duration,
          price: course.price,
          thumbnailUrl: course.thumbnailUrl || '',
          isPublished: course.isPublished
        });
      } else {
        setError(response.message || 'Failed to load course data.');
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
    } else if (name === 'duration' || name === 'price') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayInputChange = (index: number, value: string, field: 'whatYouWillLearn' | 'thisCourseInclude') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddArrayItem = (field: 'whatYouWillLearn' | 'thisCourseInclude') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const handleRemoveArrayItem = (index: number, field: 'whatYouWillLearn' | 'thisCourseInclude') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setValidationErrors([]);

    try {
      const instructorId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id;

      // Prepare the payload with only the required fields for the API
      const basePayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        language: formData.language,
        whatYouWillLearn: formData.whatYouWillLearn.filter(item => item.trim() !== ''),
        thisCourseInclude: formData.thisCourseInclude.filter(item => item.trim() !== ''),
        duration: formData.duration,
        price: formData.price,
        thumbnailUrl: formData.thumbnailUrl || '',
        isPublished: formData.isPublished
      };

      let response: ApiResponse<Course>;
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} course with data:`, basePayload);
      
      if (isEditMode) {
        // For edit mode, don't include instructorId in the payload
        response = await CourseAPI.updateCourse(courseId as string, basePayload);
      } else {
        // For create mode, include instructorId
        const createPayload = {
          ...basePayload,
          instructorId
        };
        response = await CourseAPI.createCourse(createPayload);
      }

      console.log('API response:', response);

      if (response.isSuccess) {
        navigate('/instructor/courses');
      } else {
        setError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} course.`);
        if (response.errors && response.errors.length > 0) {
          setValidationErrors(response.errors.filter(e => e)); // Filter out empty error messages
        }
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} course:`, error);
      
      // Enhanced error handling
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} course. `;
      
      if (error.response) {
        errorMessage += `Server returned: ${error.response.data?.message || error.response.statusText || error.message}`;
        if (error.response.data?.errors?.length) {
          setValidationErrors(error.response.data.errors);
        }
      } else if (error.request) {
        errorMessage += 'No response received from server. Please check your network connection.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              name="language"
              id="language"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.language}
              onChange={handleInputChange}
            >
              {LANGUAGES.map(language => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="duration"
              id="duration"
              min="0"
              step="0.5"
              required
              className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              value={formData.duration}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What You'll Learn <span className="text-red-500">*</span>
          </label>
          {formData.whatYouWillLearn.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayInputChange(index, e.target.value, 'whatYouWillLearn')}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="e.g., Build responsive web applications"
              />
              <button
                type="button"
                onClick={() => handleRemoveArrayItem(index, 'whatYouWillLearn')}
                className="text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem('whatYouWillLearn')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Learning Objective
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            This Course Includes <span className="text-red-500">*</span>
          </label>
          {formData.thisCourseInclude.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayInputChange(index, e.target.value, 'thisCourseInclude')}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="e.g., 4 hours of on-demand video"
              />
              <button
                type="button"
                onClick={() => handleRemoveArrayItem(index, 'thisCourseInclude')}
                className="text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem('thisCourseInclude')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Course Feature
          </button>
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