import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson } from '../../../api/axios';
import LessonCreationForm from '../../../components/lesson/LessonCreationForm';

const NewLesson: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  if (!courseId) {
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
              <p className="mt-1 text-sm text-red-700">Course ID is required</p>
              <button
                onClick={() => navigate('/instructor/courses')}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                Go to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLessonCreated = (lesson: Lesson) => {
    // Navigate to lesson management page for the course
    navigate(`/instructor/courses/${courseId}/lessons`);
  };

  const handleCancel = () => {
    // Navigate back to lesson management page
    navigate(`/instructor/courses/${courseId}/lessons`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-color-primary">Create New Lesson</h1>
        </div>
        <button
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
      </div>

      <LessonCreationForm 
        courseId={Number(courseId)}
        onSuccess={handleLessonCreated}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewLesson; 