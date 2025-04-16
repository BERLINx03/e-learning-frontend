import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseAPI } from '../../../api/axios';
import { toast } from 'react-hot-toast';

interface QuizQuestion {
  id?: number;
  questionText: string;
  points: number;
  answers: {
    id?: number;
    answerText: string;
    isCorrect: boolean;
  }[];
}

const QuizManagement: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [quizOrder, setQuizOrder] = useState(0);

  useEffect(() => {
    if (quizId) {
      fetchQuizDetails();
    } else {
      // New quiz
      fetchMaxOrderFromLessons();
      setLoading(false);
      addNewQuestion();
    }
  }, [quizId]);

  const fetchMaxOrderFromLessons = async () => {
    try {
      if (!courseId) return;
      
      const response = await CourseAPI.getLessonsByCourseId(Number(courseId));
      
      if (response.isSuccess && response.data && response.data.length > 0) {
        // Find the maximum order value and add 1
        const maxOrder = Math.max(...response.data.map(lesson => lesson.order || 0));
        setQuizOrder(maxOrder + 1);
      }
    } catch (error) {
      console.error('Error fetching lessons for order calculation:', error);
      // If we can't fetch the order, we'll use 0 as default
    }
  };

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const response = await CourseAPI.getLessonById(Number(quizId));
      
      if (response.isSuccess && response.data) {
        const quiz = response.data;
        setQuizTitle(quiz.title);
        setQuizDescription(quiz.description);
        setQuizOrder(quiz.order || 0);
        
        console.log(`Fetching quiz questions for lesson ID: ${quizId}`);
        // Display the direct API URL for debugging purposes
        console.log(`Direct API URL: https://localhost:7104/api/Quiz/lessons/${quizId}/questions`);
        // Fetch quiz questions using the dedicated endpoint
        const questionsResponse = await CourseAPI.getQuizQuestions(Number(quizId));
        console.log('Quiz questions API response:', questionsResponse);
        
        if (questionsResponse.isSuccess && questionsResponse.data && questionsResponse.data.length > 0) {
          console.log(`Found ${questionsResponse.data.length} questions for this quiz`);
          setQuestions(questionsResponse.data);
          setCurrentQuestionIndex(0);
          toast.success(`Loaded ${questionsResponse.data.length} questions from quiz`);
        } else {
          // If no questions found or error fetching questions, initialize with a new question
          console.log('No questions found for this quiz, initializing with empty question');
          addNewQuestion();
          toast.success('No existing questions found. You can add questions now.');
        }
      } else {
        toast.error('Failed to fetch quiz details');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('An error occurred while fetching quiz details');
    } finally {
      setLoading(false);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: QuizQuestion = {
      questionText: '',
      points: 10,
      answers: [
        { answerText: '', isCorrect: true },
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false }
      ]
    };
    
    setQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const deleteQuestion = async (index: number) => {
    if (questions.length <= 1) {
      toast.error('Quiz must have at least one question');
      return;
    }

    const questionToDelete = questions[index];

    // If this question has an ID, it exists in the database and needs to be deleted via API
    if (questionToDelete.id) {
      try {
        const response = await CourseAPI.deleteQuizQuestion(questionToDelete.id);
        if (response.isSuccess) {
          toast.success('Question deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete question');
          return; // Don't proceed with UI update if API call failed
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        toast.error('Failed to delete question. Please try again.');
        return;
      }
    }

    // Update UI state after successful API call or for new questions
    setQuestions(prev => prev.filter((_, i) => i !== index));
    
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentQuestionIndex(questions.length - 2);
    } else if (currentQuestionIndex === index) {
      setCurrentQuestionIndex(Math.max(0, index - 1));
    }
  };

  const updateQuestionText = (text: string) => {
    if (currentQuestionIndex < 0) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].questionText = text;
    setQuestions(updatedQuestions);
  };

  const updateQuestionPoints = (points: number) => {
    if (currentQuestionIndex < 0) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].points = points;
    setQuestions(updatedQuestions);
  };

  const updateAnswerText = (index: number, text: string) => {
    if (currentQuestionIndex < 0) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answers[index].answerText = text;
    setQuestions(updatedQuestions);
  };

  const setCorrectAnswer = (index: number) => {
    if (currentQuestionIndex < 0) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answers = updatedQuestions[currentQuestionIndex].answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setQuestions(updatedQuestions);
  };

  const addAnswer = () => {
    if (currentQuestionIndex < 0) return;
    
    const question = questions[currentQuestionIndex];
    if (question.answers.length >= 10) {
      toast.error('Maximum 10 answers allowed');
      return;
    }
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answers.push({
      answerText: '',
      isCorrect: false
    });
    setQuestions(updatedQuestions);
  };

  const deleteAnswer = (index: number) => {
    if (currentQuestionIndex < 0) return;
    
    const question = questions[currentQuestionIndex];
    if (question.answers.length <= 2) {
      toast.error('Minimum 2 answers required');
      return;
    }
    
    const wasCorrect = question.answers[index].isCorrect;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answers = question.answers.filter((_, i) => i !== index);
    
    // If we removed the correct answer, make the first one correct
    if (wasCorrect) {
      updatedQuestions[currentQuestionIndex].answers[0].isCorrect = true;
    }
    
    setQuestions(updatedQuestions);
  };

  const validateQuiz = () => {
    if (!quizTitle.trim()) {
      toast.error('Quiz title is required');
      return false;
    }
    
    if (!quizDescription.trim()) {
      toast.error('Quiz description is required');
      return false;
    }
    
    if (questions.length === 0) {
      toast.error('Quiz must have at least one question');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.questionText.trim()) {
        setCurrentQuestionIndex(i);
        toast.error(`Question ${i + 1} has no text`);
        return false;
      }
      
      if (question.answers.some(a => !a.answerText.trim())) {
        setCurrentQuestionIndex(i);
        toast.error(`Question ${i + 1} has empty answers`);
        return false;
      }
      
      if (!question.answers.some(a => a.isCorrect)) {
        setCurrentQuestionIndex(i);
        toast.error(`Question ${i + 1} has no correct answer selected`);
        return false;
      }
    }
    
    return true;
  };

  const handleSaveQuiz = async () => {
    if (!validateQuiz()) return;
    
    setIsSaving(true);
    
    try {
      if (quizId) {
        // Update existing quiz
        const quizData = {
          title: quizTitle,
          description: quizDescription,
          courseId: Number(courseId),
          documentUrl: "",
          isQuiz: true,
          order: quizOrder
        };
        
        const updateResponse = await CourseAPI.updateLesson(Number(quizId), quizData);
        
        if (updateResponse.isSuccess) {
          // Process each question - update existing ones and add new ones
          for (const question of questions) {
            if (question.id) {
              // Update existing question
              const questionData = {
                lessonId: Number(quizId),
                questionText: question.questionText,
                points: question.points,
                answers: question.answers.map(a => ({
                  id: a.id,
                  answerText: a.answerText,
                  isCorrect: a.isCorrect
                }))
              };
              
              const updateQuestionResponse = await CourseAPI.updateQuizQuestion(question.id, questionData);
              if (!updateQuestionResponse.isSuccess) {
                console.error(`Failed to update question ${question.id}:`, updateQuestionResponse.message);
              }
            } else {
              // Add new question
              await CourseAPI.addQuizQuestion(Number(quizId), {
                questionText: question.questionText,
                points: question.points,
                answers: question.answers.map(a => ({
                  answerText: a.answerText,
                  isCorrect: a.isCorrect
                }))
              });
            }
          }
          
          toast.success('Quiz updated successfully');
          navigate(`/instructor/courses/${courseId}/lessons`);
        } else {
          toast.error(updateResponse.message || 'Failed to update quiz');
        }
      } else {
        // Create new quiz
        const quizData = {
          title: quizTitle,
          description: quizDescription,
          courseId: Number(courseId),
          documentUrl: "", // Include empty documentUrl
          isQuiz: true,
          order: quizOrder // Use the calculated order value from fetchMaxOrderFromLessons()
        };
        
        // Log the order value being used
        console.log('Creating quiz with order value:', quizOrder);
        console.log('Quiz data payload:', JSON.stringify(quizData, null, 2));
        
        try {
          // First, create the lesson and wait for the response
          const createResponse = await CourseAPI.createLesson(quizData);
          
          if (createResponse.isSuccess && createResponse.data) {
            const newQuizId = createResponse.data.id;
            
            // After successful lesson creation, add all questions
            try {
              // Use Promise.all to handle any failures in question creation
              const questionPromises = questions.map(question => 
                CourseAPI.addQuizQuestion(newQuizId, {
                  questionText: question.questionText,
                  points: question.points,
                  answers: question.answers.map(a => ({
                    answerText: a.answerText,
                    isCorrect: a.isCorrect
                  }))
                })
              );
              
              const questionResults = await Promise.all(questionPromises);
              
              // Check if all questions were added successfully
              const allQuestionsSucceeded = questionResults.every(result => result.isSuccess);
              
              if (allQuestionsSucceeded) {
                toast.success('Quiz created successfully');
                navigate(`/instructor/courses/${courseId}/lessons`);
              } else {
                // Some questions failed to add
                const failedQuestions = questionResults.filter(result => !result.isSuccess);
                toast.error(`Quiz created but ${failedQuestions.length} questions failed to add`);
                navigate(`/instructor/courses/${courseId}/lessons`);
              }
            } catch (questionError) {
              console.error('Error adding quiz questions:', questionError);
              toast.error('Quiz created but questions could not be added');
              navigate(`/instructor/courses/${courseId}/lessons`);
            }
          } else {
            // Lesson creation failed
            toast.error(createResponse.message || 'Failed to create quiz');
          }
        } catch (lessonError) {
          console.error('Error creating quiz lesson:', lessonError);
          toast.error('Failed to create quiz. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('An error occurred while saving the quiz');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-color-primary">
            {quizId ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-color-secondary mt-1">
            Create engaging assessments for your students
          </p>
        </div>
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-color-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lessons
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Quiz Details and Questions List */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-secondary border-b border-primary">
            <h2 className="text-lg font-medium text-color-primary">Quiz Details</h2>
          </div>
          
          <div className="p-4">
            {/* Quiz Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-color-primary mb-1">
                Quiz Title*
              </label>
              <input
                type="text"
                id="title"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter quiz title"
              />
            </div>

            {/* Quiz Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-color-primary mb-1">
                Quiz Description*
              </label>
              <textarea
                id="description"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter quiz description"
              />
            </div>
            
            {/* Quiz Order */}
            <div className="mb-6">
              <label htmlFor="order" className="block text-sm font-medium text-color-primary mb-1">
                Quiz Order*
              </label>
              <input
                type="number"
                id="order"
                value={quizOrder}
                onChange={(e) => setQuizOrder(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Quiz display order"
              />
              <p className="mt-1 text-xs text-color-secondary">
                The position of this quiz in the course (0 is first)
              </p>
            </div>
          </div>

          <div className="p-4 bg-secondary border-t border-b border-primary">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-color-primary">Questions</h2>
              <span className="text-sm text-gray-500">{questions.length} questions</span>
            </div>
          </div>

          <ul className="divide-y divide-primary max-h-[500px] overflow-y-auto">
            {questions.map((question, index) => (
              <li
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`p-4 cursor-pointer transition-colors ${
                  currentQuestionIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-secondary'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium text-color-primary mr-3">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-color-primary truncate">
                        {question.questionText || '(Untitled Question)'}
                      </p>
                      <p className="text-xs text-color-secondary mt-1">
                        {question.points} points • {question.answers.length} answers
                        {question.id && <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">Saved</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Use Promise handling for the async function
                      deleteQuestion(index)
                        .catch(error => {
                          console.error('Error in delete handler:', error);
                        });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="p-4 border-t border-primary">
            <button
              type="button"
              onClick={addNewQuestion}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Question
            </button>
          </div>
        </div>

        {/* Right Panel - Question Editor */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-sm">
            <div className="p-4 bg-secondary border-b border-primary">
              <h2 className="text-lg font-medium text-color-primary">
                {currentQuestionIndex >= 0 
                  ? questions[currentQuestionIndex].id 
                    ? `Edit Question ${currentQuestionIndex + 1} (ID: ${questions[currentQuestionIndex].id})` 
                    : `New Question ${currentQuestionIndex + 1}`
                  : 'Add your first question'}
              </h2>
            </div>

            {currentQuestionIndex >= 0 ? (
              <div className="p-4">
                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <label htmlFor="questionText" className="block text-sm font-medium text-color-primary mb-1">
                      Question Text*
                    </label>
                    <textarea
                      id="questionText"
                      value={questions[currentQuestionIndex].questionText}
                      onChange={(e) => updateQuestionText(e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., What is the result of '2' + 2 in JavaScript?"
                    />
                  </div>

                  {/* Points */}
                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-color-primary mb-1">
                      Points*
                    </label>
                    <input
                      type="number"
                      id="points"
                      value={questions[currentQuestionIndex].points}
                      onChange={(e) => updateQuestionPoints(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Answers */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-color-primary">
                        Answer Options*
                      </label>
                      <button
                        type="button"
                        onClick={addAnswer}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Answer
                      </button>
                    </div>

                    <div className="space-y-3">
                      {questions[currentQuestionIndex].answers.map((answer, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex items-center h-5">
                            <input
                              id={`answer-${index}`}
                              name="correct-answer"
                              type="radio"
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          </div>
                          <div className="flex-grow">
                            <input
                              type="text"
                              value={answer.answerText}
                              onChange={(e) => updateAnswerText(index, e.target.value)}
                              placeholder={`Answer option ${index + 1}`}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          {questions[currentQuestionIndex].answers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => deleteAnswer(index)}
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
                    <p className="mt-1 text-sm text-gray-500">
                      Select the radio button next to the correct answer
                    </p>
                  </div>
                  
                  {/* Add Save Question button */}
                  {quizId && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const currentQuestion = questions[currentQuestionIndex];
                            
                            if (!currentQuestion.questionText.trim()) {
                              toast.error('Question text is required');
                              return;
                            }
                            
                            if (currentQuestion.answers.some(a => !a.answerText.trim())) {
                              toast.error('All answers must have text');
                              return;
                            }
                            
                            if (!currentQuestion.answers.some(a => a.isCorrect)) {
                              toast.error('You must select a correct answer');
                              return;
                            }
                            
                            if (currentQuestion.id) {
                              // Update existing question
                              const questionData = {
                                lessonId: Number(quizId),
                                questionText: currentQuestion.questionText,
                                points: currentQuestion.points,
                                answers: currentQuestion.answers.map(a => ({
                                  id: a.id,
                                  answerText: a.answerText,
                                  isCorrect: a.isCorrect
                                }))
                              };
                              
                              const response = await CourseAPI.updateQuizQuestion(currentQuestion.id, questionData);
                              if (response.isSuccess) {
                                toast.success('Question updated successfully');
                              } else {
                                toast.error(response.message || 'Failed to update question');
                              }
                            } else {
                              // Add new question
                              const response = await CourseAPI.addQuizQuestion(Number(quizId), {
                                questionText: currentQuestion.questionText,
                                points: currentQuestion.points,
                                answers: currentQuestion.answers.map(a => ({
                                  answerText: a.answerText,
                                  isCorrect: a.isCorrect
                                }))
                              });
                              
                              if (response.isSuccess && response.data) {
                                // Update the questions array with the newly created question ID
                                const updatedQuestions = [...questions];
                                updatedQuestions[currentQuestionIndex] = {
                                  ...currentQuestion,
                                  id: response.data.id,
                                  answers: response.data.answers || currentQuestion.answers
                                };
                                setQuestions(updatedQuestions);
                                toast.success('Question saved successfully');
                              } else {
                                toast.error(response.message || 'Failed to save question');
                              }
                            }
                            
                            // Refresh questions after saving
                            if (quizId) {
                              const refreshResponse = await CourseAPI.getQuizQuestions(Number(quizId));
                              if (refreshResponse.isSuccess && refreshResponse.data) {
                                setQuestions(refreshResponse.data);
                                // Try to keep the same question selected
                                const newIndex = refreshResponse.data.findIndex(q => 
                                  q.questionText === currentQuestion.questionText
                                );
                                setCurrentQuestionIndex(newIndex >= 0 ? newIndex : 0);
                              }
                            }
                          } catch (error) {
                            console.error('Error saving question:', error);
                            toast.error('An error occurred while saving the question');
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="w-4 h-4 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Question
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  Add a question using the 'Add Question' button on the left panel
                </p>
              </div>
            )}
          </div>

          {/* Save Quiz Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveQuiz}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Quiz...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {quizId ? 'Update Quiz' : 'Create Quiz'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement; 