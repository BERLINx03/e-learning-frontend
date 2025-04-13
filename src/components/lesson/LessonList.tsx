import React from 'react';
import { Lesson } from '../../api/axios';

interface LessonListProps {
  lessons: Lesson[];
  activeLessonId: number | null;
  onLessonSelect: (lesson: Lesson) => void;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, activeLessonId, onLessonSelect }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm">
      <div className="p-4 border-b border-primary">
        <h3 className="text-lg font-medium text-color-primary">Course Content</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {lessons.map((lesson) => (
          <div 
            key={lesson.id}
            onClick={() => onLessonSelect(lesson)}
            className={`p-4 cursor-pointer hover:bg-secondary transition-colors ${
              lesson.id === activeLessonId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {lesson.isQuiz ? (
                  <svg className="w-5 h-5 mr-3 text-color-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3 text-color-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <p className="text-sm font-medium text-color-primary">{lesson.title}</p>
                  <p className="text-xs text-color-secondary mt-1 truncate">{lesson.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-color-secondary mr-2">
                  {lesson.isQuiz ? 'Quiz' : 'Lesson'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonList; 