import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CourseAPI } from '../api/axios';
import { toast } from 'react-hot-toast';
import CourseContent from '../components/lesson/CourseContent';

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

interface EditCourseData {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  isPublished: boolean;
  // Remove thumbnailUrl from here since we'll use the dedicated endpoint
}

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({
    thumbnail: false,
    [`instructor-${course?.instructor?.id}`]: false,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<EditCourseData | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    // Reset image errors when course data changes
    if (course) {
      setImageErrors({
        thumbnail: false,
        [`instructor-${course.instructor?.id}`]: false,
        ...(course.messages?.reduce((acc, message) => ({
          ...acc,
          [`message-${message.id}`]: false
        }), {})),
        ...(course.enrollments?.reduce((acc, enrollment) => ({
          ...acc,
          [`enrollment-${enrollment.id}`]: false
        }), {}))
      });
    }
  }, [course]);

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

  const isInstructor = course?.instructorId === user?.id || false;

  const isUserEnrolled = course?.enrollments?.some(
    enrollment => enrollment.studentId === user?.id
  ) || isInstructor || false;

  const canAccessMessages = isUserEnrolled || isInstructor;

  const handleImageError = (key: string) => {
    setImageErrors(prev => ({
      ...prev,
      [key]: true
    }));
  };

  // Add a function to handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  // Add a function to upload the thumbnail
  const uploadThumbnail = async () => {
    if (!thumbnailFile || !course) return;
    
    try {
      setIsUploadingThumbnail(true);
      const response = await CourseAPI.uploadThumbnail(course.id, thumbnailFile);
      
      if (response.isSuccess && response.data) {
        // Update the local course data with the new thumbnail URL
        setCourse(prev => prev ? { ...prev, thumbnailUrl: response.data } : null);
        setThumbnailFile(null);
        toast.success('Thumbnail updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update thumbnail');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  // Update the handleSaveChanges function
  const handleSaveChanges = async () => {
    if (!course || !editData) return;
    
    try {
      setSaving(true);
      
      const updatedCourse = {
        ...editData
        // Note: We're no longer sending thumbnailUrl here
      };
      
      const response = await CourseAPI.updateCourse(course.id, updatedCourse);
      
      if (response.isSuccess) {
        // If we also need to upload a thumbnail
        if (thumbnailFile) {
          await uploadThumbnail();
        }
        
        setCourse(prev => prev ? { ...prev, ...updatedCourse } : null);
        setEditing(false);
        toast.success('Course updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('You need to be logged in to enroll in a course');
      navigate('/auth/login');
      return;
    }

    if (!course) {
      toast.error('Course information not available');
      return;
    }

    try {
      setEnrolling(true);
      const response = await CourseAPI.enrollInCourse(course.id);
      
      if (response.isSuccess) {
        toast.success('Successfully enrolled in the course!');
        fetchCourseDetails(); // Refresh to update enrollment status
      } else {
        toast.error(response.message || 'Failed to enroll in the course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('An error occurred while enrolling in the course');
    } finally {
      setEnrolling(false);
    }
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
              <div className="flex items-start mt-6 bg-gray-800 rounded-lg p-6">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
                  {course.instructor?.profilePictureUrl && !imageErrors[`instructor-${course.instructor?.id}`] ? (
                    <img
                      src={course.instructor.profilePictureUrl}
                      alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(`instructor-${course.instructor?.id}`)}
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-purple-600">
                        {course.instructor?.firstName?.[0]?.toUpperCase()}
                        {course.instructor?.lastName?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-6 flex-1">
                  <p className="text-sm text-gray-400 mb-1">Created by</p>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </h3>
                  {course.instructor?.bio && (
                    <p className="text-sm text-gray-300 max-w-2xl line-clamp-2">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Preview Card */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative pb-[56.25%] bg-gray-200">
                  {!imageErrors.thumbnail && course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => handleImageError('thumbnail')}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="text-3xl font-bold text-gray-900">£{course.price.toFixed(2)}</div>
                    {isInstructor ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/instructor/courses/edit/${course.id}`)}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
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
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                            course.isPublished 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {course.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    ) : !isUserEnrolled && (
                      <button 
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enrolling ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enrolling...
                          </span>
                        ) : 'Enroll now'}
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

        {/* Course Content Section */}
        <CourseContent courseId={course.id} isEnrolled={isUserEnrolled} isInstructor={isInstructor} />

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
                    {!imageErrors[`message-${message.id}`] && message.instructor?.profilePictureUrl ? (
                      <img
                        src={message.instructor?.profilePictureUrl}
                        alt={`${message.instructor?.firstName} ${message.instructor?.lastName}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(`message-${message.id}`)}
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          {message.instructor?.firstName?.[0]}{message.instructor?.lastName?.[0]}
                        </span>
                      </div>
                    )}
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
                            {!imageErrors[`enrollment-${enrollment.id}`] && enrollment.student?.profilePictureUrl ? (
                              <img
                                src={enrollment.student?.profilePictureUrl}
                                alt={`${enrollment.student?.firstName} ${enrollment.student?.lastName}`}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(`enrollment-${enrollment.id}`)}
                              />
                            ) : (
                              <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-600">
                                  {enrollment.student?.firstName?.[0]}{enrollment.student?.lastName?.[0]}
                                </span>
                              </div>
                            )}
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

        {/* Course thumbnail section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course Thumbnail</h3>
          
          <div className="flex items-start">
            {!imageErrors.thumbnail && (course?.thumbnailUrl || thumbnailFile) ? (
              <div className="relative w-40 h-24 rounded-md overflow-hidden">
                <img
                  src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : course?.thumbnailUrl}
                  alt={course?.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError('thumbnail')}
                />
              </div>
            ) : (
              <div className="w-40 h-24 bg-gray-200 flex items-center justify-center rounded-md">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="ml-4 flex-1">
              {editing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-gray-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-md file:border-0
                             file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700
                             hover:file:bg-blue-100"
                  />
                  {thumbnailFile && (
                    <button
                      type="button"
                      onClick={uploadThumbnail}
                      disabled={isUploadingThumbnail}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isUploadingThumbnail ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        'Upload Now'
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {course?.thumbnailUrl 
                    ? 'This is the current thumbnail for your course. You can change it by editing the course.'
                    : 'This course has no thumbnail image. Add one by editing the course.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 