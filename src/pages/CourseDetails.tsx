import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CourseAPI } from '../api/axios';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  role: string;
  bio?: string;
}

interface CourseMessage {
  id: number;
  courseId: number;
  instructorId: number;
  instructor: User;
  message: string;
  sentAt: string;
  isRead: boolean;
}

interface Progress {
  id: number;
  enrollmentId: number;
  lessonId: number;
  isCompleted: boolean;
  completedAt: string;
  quizScore: number;
}

interface Certificate {
  id: number;
  enrollmentId: number;
  certificateUrl: string;
  issuedAt: string;
  certificateNumber: string;
}

interface Enrollment {
  id: number;
  studentId: number;
  student: User;
  courseId: number;
  enrolledAt: string;
  isCompleted: boolean;
  completedAt: string;
  finalGrade: number;
  certificate?: Certificate;
  progress: Progress[];
}

interface Answer {
  id: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  lessonId: number;
  questionText: string;
  points: number;
  answers: Answer[];
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  description: string;
  courseId: number;
  order: number;
  videoUrl?: string;
  documentUrl?: string;
  isQuiz: boolean;
  createdAt: string;
  updatedAt: string;
  quizQuestions: QuizQuestion[];
  progress: Progress[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  whatYouWillLearn: string[];
  thisCourseInclude: string[];
  duration: number;
  price: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  instructorId: number;
  instructor?: User;
  lessons?: Lesson[];
  enrollments?: Enrollment[];
  messages?: CourseMessage[];
}

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await CourseAPI.getCourseById(Number(id));
      
      if (response.isSuccess && response.data) {
        setCourse(response.data);
      } else {
        setError(response.message || 'Failed to fetch course details');
      }
    } catch (error) {
      setError('An error occurred while fetching course details');
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !course) return;

    try {
      const response = await CourseAPI.sendCourseMessage(course.id, {
        message: newMessage.trim()
      });

      if (response.isSuccess) {
        setNewMessage('');
        fetchCourseDetails(); // Refresh to get the new message
      } else {
        alert('Failed to send message: ' + response.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserEnrolled = course?.enrollments?.some(
    enrollment => enrollment.studentId === user?.id
  ) || false;

  const isInstructor = course?.instructorId === user?.id || false;

  const canAccessMessages = isUserEnrolled || isInstructor;

  const handleImageError = (key: string) => {
    setImageErrors(prev => ({
      ...prev,
      [key]: true
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error || 'Course not found'}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header - Dark background section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex mb-4 text-sm">
            <span className="text-gray-400">Development</span>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-400">{course.category}</span>
          </nav>
          
          {/* Course Title Section */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-xl text-gray-300 mb-4">{course.description}</p>
              
              {/* Course Stats */}
              <div className="flex items-center flex-wrap gap-4 text-sm mb-4">
                {course.isPublished && (
                  <>
                    <div className="flex items-center">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-md mr-2">Bestseller</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-orange-500 mr-1">4.8</span>
                      <div className="flex text-orange-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-400 ml-1">({course.enrollments?.length || 0} students)</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{course.duration} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>{course.language}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-start mt-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700">
                  <img
                    src={imageErrors[`instructor-${course.instructor?.id}`] ? '/default-avatar.png' : (course.instructor?.profilePictureUrl || '/default-avatar.png')}
                    alt={`${course.instructor?.firstName} ${course.instructor?.lastName}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(`instructor-${course.instructor?.id}`)}
                  />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Created by</p>
                  <p className="text-blue-400 hover:text-blue-300">
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </p>
                  {course.instructor?.bio && (
                    <p className="mt-2 text-sm text-gray-300 max-w-2xl">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Preview Card */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl font-bold">£{course.price.toFixed(2)}</div>
                    {isInstructor && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/instructor/courses/edit/${course.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit Course
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const updatedCourse = {
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
                                isPublished: !course.isPublished
                              };
                              
                              const response = await CourseAPI.updateCourse(course.id, updatedCourse);
                              
                              if (response.isSuccess) {
                                fetchCourseDetails();
                              } else {
                                alert(`Failed to update course status: ${response.message}`);
                              }
                            } catch (error) {
                              console.error('Failed to update course status:', error);
                              alert('Failed to update course status. Please try again.');
                            }
                          }}
                          className={`px-4 py-2 rounded ${
                            course.isPublished 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {course.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    )}
                    {!isInstructor && !isUserEnrolled && (
                      <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                        Enroll now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* What you'll learn section */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.whatYouWillLearn.map((item, index) => (
              <div key={index} className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* This course includes section */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">This course includes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.thisCourseInclude.map((item, index) => (
              <div key={index} className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages and Enrollment sections remain unchanged */}
        {canAccessMessages && (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Course Messages</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {course?.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex space-x-3 ${
                    message.instructorId === course?.instructorId
                      ? 'bg-blue-50 p-4 rounded-lg'
                      : 'bg-gray-50 p-4 rounded-lg'
                  }`}
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={imageErrors[`message-${message.id}`] ? '/default-avatar.png' : (message?.instructor?.profilePictureUrl || '/default-avatar.png')}
                      alt={`${message?.instructor?.firstName} ${message?.instructor?.lastName}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(`message-${message.id}`)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {message?.instructor?.firstName} {message?.instructor?.lastName}
                        {message.instructorId === course?.instructorId && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            Instructor
                          </span>
                        )}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(message.sentAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="mt-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}

        {isInstructor && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Enrolled Students</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course?.enrollments?.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            <img
                              src={imageErrors[`enrollment-${enrollment.id}`] ? '/default-avatar.png' : (enrollment?.student?.profilePictureUrl || '/default-avatar.png')}
                              alt={`${enrollment?.student?.firstName} ${enrollment?.student?.lastName}`}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(`enrollment-${enrollment.id}`)}
                            />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {enrollment?.student?.firstName} {enrollment?.student?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{enrollment?.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(enrollment.enrolledAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{
                                width: `${(enrollment?.progress?.filter(p => p.isCompleted).length / (course?.lessons?.length || 1)) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            {Math.round((enrollment?.progress?.filter(p => p.isCompleted).length / (course?.lessons?.length || 1)) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          enrollment.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {enrollment.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails; 