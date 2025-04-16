import React from 'react';
import { QuizQuestion } from '../../api/axios';

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  onDeleteQuestion?: (questionId: number) => void;
  onEditQuestion?: (question: QuizQuestion) => void;
}

const QuizQuestionList: React.FC<QuizQuestionListProps> = ({ 
  questions, 
  onDeleteQuestion, 
  onEditQuestion 
}) => {
  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">No questions added yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quiz Questions ({questions.length})</h3>
        {questions.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total points: {questions.reduce((sum, q) => sum + q.points, 0)}
          </span>
        )}
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {questions.map((question, qIndex) => (
          <li key={question.id} className="p-4">
            <div className="mb-2 flex justify-between items-start">
              <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 h-6 w-6 text-sm font-medium mr-2">
                  {qIndex + 1}
                </span>
                {question.questionText}
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {question.points} points
                </span>
                {onEditQuestion && (
                  <button
                    onClick={() => onEditQuestion(question)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDeleteQuestion && (
                  <button
                    onClick={() => onDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.answers.map((answer, aIndex) => (
                  <li 
                    key={answer.id} 
                    className={`text-sm py-2 px-3 rounded-md border ${
                      answer.isCorrect 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                    } flex items-center`}
                  >
                    <span className="inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 h-5 w-5 text-xs font-medium text-gray-800 dark:text-gray-300 mr-2">
                      {String.fromCharCode(65 + aIndex)}
                    </span>
                    {answer.answerText}
                    {answer.isCorrect && (
                      <svg className="w-4 h-4 ml-auto text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizQuestionList; 