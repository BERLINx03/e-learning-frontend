import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseAPI, QuizQuestion, Answer, Progress } from '../../api/axios';
import { toast } from 'react-hot-toast';

const QuizView: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  
  useEffect(() => {
    if (lessonId) {
      fetchQuizProgress();
    }
  }, [lessonId]);

  const fetchQuizProgress = async () => {
    try {
      setLoading(true);
      // First, check if the quiz has already been completed
      const progressResponse = await CourseAPI.getLessonProgress(Number(lessonId));
      
      if (progressResponse.isSuccess && progressResponse.data) {
        setProgress(progressResponse.data);
        
        // If lesson is already completed, show the results with the previous score
        if (progressResponse.data.isCompleted) {
          setPreviousScore(progressResponse.data.quizScore);
          setIsCompleted(true);
          setQuizSubmitted(true);
          
          // Also fetch lesson details to get title and description
          const lessonResponse = await CourseAPI.getLessonById(Number(lessonId));
          if (lessonResponse.isSuccess && lessonResponse.data) {
            setQuizTitle(lessonResponse.data.title);
            setQuizDescription(lessonResponse.data.description);
          }
          
          toast("You've already completed this quiz. Your score was " + progressResponse.data.quizScore + "%");
          setLoading(false);
          return;
        }
      }
      
      // If not completed, proceed with fetching quiz details and questions
      await fetchQuizDetails();
    } catch (error) {
      console.error('Error fetching quiz progress:', error);
      // If there's an error getting progress, still try to fetch the quiz
      await fetchQuizDetails();
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizDetails = async () => {
    try {
      // Fetch lesson details first to get title and description
      const response = await CourseAPI.getLessonById(Number(lessonId));
      
      if (response.isSuccess && response.data) {
        const quiz = response.data;
        setQuizTitle(quiz.title);
        setQuizDescription(quiz.description);
        
        // Then fetch the questions
        const questionsResponse = await CourseAPI.getQuizQuestions(Number(lessonId));
        
        if (questionsResponse.isSuccess && questionsResponse.data && questionsResponse.data.length > 0) {
          setQuestions(questionsResponse.data);
          // Initialize selectedAnswers with empty values
          const initialAnswers: Record<number, number> = {};
          questionsResponse.data.forEach(question => {
            initialAnswers[question.id] = 0; // 0 means no answer selected
          });
          setSelectedAnswers(initialAnswers);
        } else {
          toast.error('No questions found for this quiz');
        }
      } else {
        toast.error('Failed to fetch quiz details');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('An error occurred while fetching quiz details');
    }
  };

  const handleAnswerSelection = (questionId: number, answerId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const validateAnswers = () => {
    const unansweredQuestions = questions.filter(q => !selectedAnswers[q.id] || selectedAnswers[q.id] === 0);
    
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions before submitting. ${unansweredQuestions.length} question(s) unanswered.`);
      return false;
    }
    
    return true;
  };

  const markLessonAsCompleted = async () => {
    try {
      const response = await CourseAPI.markLessonAsCompleted(Number(lessonId));
      if (response.isSuccess) {
        console.log('Quiz marked as completed');
        
        // Fetch the updated progress to get the official quiz score
        const progressResponse = await CourseAPI.getLessonProgress(Number(lessonId));
        if (progressResponse.isSuccess && progressResponse.data) {
          setProgress(progressResponse.data);
          setPreviousScore(progressResponse.data.quizScore);
        }
      } else {
        console.error('Failed to mark quiz as completed:', response.message);
      }
    } catch (error) {
      console.error('Error marking quiz as completed:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!validateAnswers()) return;
    
    setIsSubmitting(true);
    
    try {
      // Filter out any entries with value 0 (unanswered)
      const answersToSubmit = Object.fromEntries(
        Object.entries(selectedAnswers)
          .filter(([_, value]) => value !== 0)
      );
      
      const response = await CourseAPI.submitQuizAnswers(Number(lessonId), answersToSubmit);
      
      if (response.isSuccess) {
        const receivedScore = response.data ?? 0;
        setScore(receivedScore);
        setPreviousScore(receivedScore);
        setQuizSubmitted(true);
        toast.success('Quiz submitted successfully');
        
        // Mark the lesson as completed after submitting the quiz
        await markLessonAsCompleted();
        setIsCompleted(true);
      } else {
        toast.error(response.message || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('An error occurred while submitting the quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`);
  };

  const calculateTotalPoints = () => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If the quiz is completed, show the results directly
  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-color-primary">
              {quizTitle}
            </h1>
            <p className="text-color-secondary mt-1">
              {quizDescription}
            </p>
          </div>
          
          <button
            onClick={handleBackToCourse}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Course
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-color-primary">
              Quiz Results
            </h2>
            
            <div className="mb-8">
              <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {previousScore !== null ? `${previousScore}%` : 'Completed'}
                </span>
              </div>
              <p className="mt-2 text-lg text-color-secondary">
                {previousScore !== null && (previousScore >= 70 ? 'Great job!' : 'Keep practicing!')}
              </p>
              {progress?.completedAt && (
                <p className="mt-2 text-sm text-color-secondary">
                  Completed on: {new Date(progress.completedAt).toLocaleString()}
                </p>
              )}
              <p className="mt-4 text-color-secondary">
                You have already completed this quiz and cannot take it again.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleBackToCourse}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-color-primary">
            {quizTitle}
          </h1>
          <p className="text-color-secondary mt-1">
            {quizDescription}
          </p>
          {!quizSubmitted && (
            <p className="text-sm mt-2 font-medium text-color-secondary">
              Total questions: {questions.length} | Total points: {calculateTotalPoints()}
            </p>
          )}
        </div>
        
        <button
          onClick={handleBackToCourse}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Course
        </button>
      </div>

      {quizSubmitted ? (
        // Quiz Results View
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-color-primary">
              Quiz Results
            </h2>
            
            <div className="mb-8">
              <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {score}%
                </span>
              </div>
              <p className="mt-2 text-lg text-color-secondary">
                {score !== null && (score >= 70 ? 'Great job!' : 'Keep practicing!')}
              </p>
            </div>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={handleBackToCourse}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Course
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Quiz Questions View
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm mr-3">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-medium text-color-primary">{question.questionText}</h3>
                </div>
                <div className="ml-11 text-sm text-color-secondary">
                  {question.points} point{question.points !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-center">
                      <input
                        id={`question-${question.id}-answer-${answer.id}`}
                        type="radio"
                        name={`question-${question.id}`}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={selectedAnswers[question.id] === answer.id}
                        onChange={() => handleAnswerSelection(question.id, answer.id)}
                      />
                      <label
                        htmlFor={`question-${question.id}-answer-${answer.id}`}
                        className="ml-3 block text-sm font-medium text-color-primary cursor-pointer"
                      >
                        {answer.answerText}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Quiz
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView; 