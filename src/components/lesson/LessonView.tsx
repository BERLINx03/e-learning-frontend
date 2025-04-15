import React, { useState } from 'react';
import { Lesson, CourseAPI } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

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
      {!lesson ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <svg className="w-16 h-16 text-color-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-color-secondary text-lg">Select a lesson to start learning</p>
        </div>
      ) : (
        <div>
          {/* Video Content */}
          {lesson.videoUrl && (
            <div className="relative aspect-video w-full bg-black">
              <video 
                className="w-full h-full"
                controls
                src={lesson.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <div className="p-6">
            {/* Document Content */}
            {lesson.documentUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-color-primary mb-3">Supplementary Material</h3>
                <a 
                  href={lesson.documentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-color-primary rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Document
                </a>
              </div>
            )}

            {/* Text Content */}
            {lesson.content && (
              <div className="prose prose-sm max-w-none text-color-primary">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonView; 