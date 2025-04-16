import React, { useState } from 'react';
import { QuizQuestion, Answer, CourseAPI } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface QuizQuestionFormProps {
  lessonId: number;
  onQuestionAdded?: (question: QuizQuestion) => void;
}

const QuizQuestionForm: React.FC<QuizQuestionFormProps> = ({ lessonId, onQuestionAdded }) => {
  const [questions, setQuestions] = useState<{
    questionText: string;
    points: number;
    answers: { answerText: string; isCorrect: boolean }[];
  }[]>([
    {
      questionText: '',
      points: 10,
      answers: [
        { answerText: '', isCorrect: true },
        { answerText: '', isCorrect: false },
      ]
    }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newQuestions = [...questions];
    newQuestions.push({
      questionText: '',
      points: 10,
      answers: [
        { answerText: '', isCorrect: true },
        { answerText: '', isCorrect: false },
      ]
    });
    setQuestions(newQuestions);
    setCurrentQuestion(newQuestions.length - 1);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('You must have at least one question');
      return;
    }
    
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    
    if (currentQuestion >= newQuestions.length) {
      setCurrentQuestion(newQuestions.length - 1);
    } else if (currentQuestion === index) {
      setCurrentQuestion(Math.max(0, index - 1));
    }
  };

  const handleQuestionTextChange = (value: string) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestion].questionText = value;
    setQuestions(newQuestions);
  };

  const handlePointsChange = (value: number) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestion].points = value;
    setQuestions(newQuestions);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestion].answers[index].answerText = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestion].answers = newQuestions[currentQuestion].answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setQuestions(newQuestions);
  };

  const handleAddAnswer = () => {
    const newQuestions = [...questions];
    if (newQuestions[currentQuestion].answers.length < 10) {
      newQuestions[currentQuestion].answers.push({ answerText: '', isCorrect: false });
      setQuestions(newQuestions);
    } else {
      toast.error('Maximum 10 answer options allowed per question');
    }
  };

  const handleRemoveAnswer = (index: number) => {
    const newQuestions = [...questions];
    if (newQuestions[currentQuestion].answers.length > 2) {
      const wasCorrect = newQuestions[currentQuestion].answers[index].isCorrect;
      newQuestions[currentQuestion].answers = newQuestions[currentQuestion].answers.filter((_, i) => i !== index);
      
      // If the removed answer was correct, set the first answer as correct by default
      if (wasCorrect && newQuestions[currentQuestion].answers.every(a => !a.isCorrect)) {
        newQuestions[currentQuestion].answers[0].isCorrect = true;
      }
      
      setQuestions(newQuestions);
    } else {
      toast.error('A question must have at least 2 answers');
    }
  };

  const validateQuestions = () => {
    // Check if any question is empty
    const emptyQuestionIndex = questions.findIndex(q => !q.questionText.trim());
    if (emptyQuestionIndex !== -1) {
      setCurrentQuestion(emptyQuestionIndex);
      toast.error(`Question ${emptyQuestionIndex + 1} has no text`);
      return false;
    }

    // Check if any question has empty answers
    for (let i = 0; i < questions.length; i++) {
      const emptyAnswerIndex = questions[i].answers.findIndex(a => !a.answerText.trim());
      if (emptyAnswerIndex !== -1) {
        setCurrentQuestion(i);
        toast.error(`Question ${i + 1} has an empty answer`);
        return false;
      }
    }

    // Check if all questions have a correct answer selected
    const noCorrectAnswerIndex = questions.findIndex(q => !q.answers.some(a => a.isCorrect));
    if (noCorrectAnswerIndex !== -1) {
      setCurrentQuestion(noCorrectAnswerIndex);
      toast.error(`Question ${noCorrectAnswerIndex + 1} has no correct answer selected`);
      return false;
    }

    return true;
  };

  const handleSubmitCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the questions for validation
    const questionToValidate = [questions[currentQuestion]];
    
    // Validate just this question
    if (!questionToValidate[0].questionText.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (questionToValidate[0].answers.some(answer => !answer.answerText.trim())) {
      toast.error('All answers must have text');
      return;
    }

    if (!questionToValidate[0].answers.some(answer => answer.isCorrect)) {
      toast.error('Please select a correct answer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle the currently focused question
      const questionData = questions[currentQuestion];
      const response = await CourseAPI.addQuizQuestion(lessonId, questionData);

      if (response.isSuccess && response.data) {
        // Clear just the current question after submission
        const newQuestions = [...questions];
        newQuestions[currentQuestion] = {
          questionText: '',
          points: 10,
          answers: [
            { answerText: '', isCorrect: true },
            { answerText: '', isCorrect: false },
          ]
        };
        setQuestions(newQuestions);
        
        toast.success('Question added successfully');
        
        if (onQuestionAdded && response.data.length > 0) {
          onQuestionAdded(response.data[0]);
        }
      } else {
        toast.error(response.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('An error occurred while adding the question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!validateQuestions()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit all questions one by one
      for (const question of questions) {
        const response = await CourseAPI.addQuizQuestion(lessonId, question);
        
        if (response.isSuccess && response.data && response.data.length > 0) {
          if (onQuestionAdded) {
            onQuestionAdded(response.data[0]);
          }
        } else {
          toast.error(`Failed to add question: ${question.questionText.substring(0, 20)}...`);
        }
      }
      
      // Reset the form after all questions are submitted
      setQuestions([{
        questionText: '',
        points: 10,
        answers: [
          { answerText: '', isCorrect: true },
          { answerText: '', isCorrect: false },
        ]
      }]);
      setCurrentQuestion(0);
      
      toast.success('All questions added successfully');
    } catch (error) {
      console.error('Error adding questions:', error);
      toast.error('An error occurred while adding questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Question tabs navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto p-2">
        {questions.map((question, index) => (
          <button
            key={index}
            type="button" 
            onClick={() => setCurrentQuestion(index)}
            className={`px-3 py-1.5 text-sm rounded-md mr-2 min-w-[100px] ${
              currentQuestion === index
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Question {index + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmitCurrent}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Question {currentQuestion + 1}
              </h3>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(currentQuestion)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div>
              <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question Text*
              </label>
              <textarea
                id="questionText"
                value={questions[currentQuestion].questionText}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                required
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="What is the result of '2' + 2 in JavaScript?"
              />
            </div>
          
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Points*
              </label>
              <input
                type="number"
                id="points"
                value={questions[currentQuestion].points}
                onChange={(e) => handlePointsChange(Number(e.target.value))}
                min={1}
                max={100}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer Options*
                </label>
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Answer
                </button>
              </div>
            
              <div className="space-y-3">
                {questions[currentQuestion].answers.map((answer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correctAnswer-${currentQuestion}`}
                      id={`answer-${currentQuestion}-${index}`}
                      checked={answer.isCorrect}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={answer.answerText}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={`Answer option ${index + 1}`}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {questions[currentQuestion].answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAnswer(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the radio button next to the correct answer
              </p>
            </div>
          
            <div className="flex justify-between pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Question...
                  </>
                ) : (
                  'Add This Question'
                )}
              </button>

              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding All Questions...
                    </>
                  ) : (
                    'Add All Questions'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizQuestionForm; 