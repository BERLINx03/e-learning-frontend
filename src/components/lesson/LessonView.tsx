import React, { useState } from 'react';
import { Lesson, CourseAPI } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface LessonViewProps {
  lesson: Lesson | null;
  onLessonCompleted?: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, onLessonCompleted }) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleMarkAsComplete = async () => {
    if (!lesson) return;
    
    try {
      setIsCompleting(true);
      const response = await CourseAPI.markLessonAsCompleted(lesson.id);
      
      if (response.isSuccess) {
        toast.success('Lesson marked as completed!');
        if (onLessonCompleted) {
          onLessonCompleted();
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

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-sm min-h-[400px]">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-color-secondary text-lg">Select a lesson to start learning</p>
      </div>
    );
  }

  const isLessonCompleted = lesson.progress && lesson.progress.some(p => p.isCompleted);

  return (
    <div className="bg-card rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-color-primary">{lesson.title}</h2>
        <p className="text-sm text-color-secondary mt-1">{lesson.description}</p>
      </div>

      <div className="p-4">
        {/* Video Content */}
        {lesson.videoUrl && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-color-primary mb-2">Video Lesson</h3>
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
          <div className="mb-6">
            <h3 className="text-lg font-medium text-color-primary mb-2">Supplementary Material</h3>
            <div className="border border-primary rounded-lg p-4 bg-secondary">
              <a 
                href={lesson.documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-color-accent hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Document
              </a>
            </div>
          </div>
        )}

        {/* Quiz Content */}
        {lesson.isQuiz && lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-color-primary mb-2">Quiz</h3>
            <div className="border border-primary rounded-lg p-4 bg-secondary">
              <p className="text-color-secondary mb-4">This lesson contains a quiz. Complete it to test your knowledge.</p>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Quiz
              </button>
            </div>
          </div>
        )}

        {/* Additional content */}
        {lesson.content && (
          <div className="mt-6 prose prose-blue max-w-none text-color-primary">
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </div>
        )}
      </div>

      {/* Mark as complete button */}
      <div className="p-4 border-t border-gray-200 flex justify-end">
        {isLessonCompleted ? (
          <div className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-success bg-green-100">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </div>
        ) : (
          <button
            onClick={handleMarkAsComplete}
            disabled={isCompleting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Complete
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonView; 