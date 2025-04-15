import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CourseAPI } from '../api/axios';
import { toast } from 'react-hot-toast';
import CourseContent from '../components/lesson/CourseContent';
import CourseStudents from '../components/course/CourseStudents';

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
  const [enrollmentStatus, setEnrollmentStatus] = useState<{isEnrolled: boolean, progress: number} | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    if (id && user) {
      checkEnrollmentStatus(Number(id));
    }
  }, [id, user]);

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

  const checkEnrollmentStatus = async (courseId: number) => {
    if (!user) return;
    
    try {
      setCheckingEnrollment(true);
      const response = await CourseAPI.getCourseEnrollmentStatus(courseId);
      
      if (response.isSuccess) {
        // Now response.data is a boolean value indicating if the user has access
        setHasAccess(response.data || false);
        
        // Maintain compatibility with old code by creating an object with the expected structure
        setEnrollmentStatus({
          isEnrolled: response.data || false,
          progress: response.data ? 0 : 0 // We don't have progress info anymore
        });
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !course) return;

    try {
      const response = await CourseAPI.sendCourseMessage(course.id, newMessage.trim());

      if (response.isSuccess) {
        setNewMessage('');
        toast.success('Message sent successfully');
        fetchCourseDetails(); // Refresh to get the new message
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
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

  const isUserEnrolled = hasAccess || enrollmentStatus?.isEnrolled || isInstructor || false;

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
        // Refresh the page to update all components after enrollment
        window.location.reload();
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

  const handleUnenroll = async () => {
    if (!user) {
      toast.error('You need to be logged in to unenroll from a course');
      return;
    }

    if (!course) {
      toast.error('Course information not available');
      return;
    }

    // Confirm before unenrolling
    if (!window.confirm('Are you sure you want to unenroll from this course? Your progress may be lost.')) {
      return;
    }

    try {
      setEnrolling(true); // Reuse the same loading state
      const response = await CourseAPI.unenrollFromCourse(course.id);
      
      if (response.isSuccess) {
        toast.success('Successfully unenrolled from the course');
        // Redirect to my courses page after unenrolling
        navigate('/my-courses');
      } else {
        toast.error(response.message || 'Failed to unenroll from the course');
      }
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      toast.error('An error occurred while unenrolling from the course');
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
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Course Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-color-secondary mb-4">
                <Link to="/courses" className="text-accent hover:text-accent-hover">
                  Courses
                </Link>
                <span className="text-color-secondary mx-2">/</span>
                <span>{course.category}</span>
              </div>

              <h1 className="text-4xl font-bold text-color-primary mb-4">{course.title}</h1>
              <p className="text-lg text-color-secondary mb-6">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 mb-8">
                {course.category && (
                  <div className="flex items-center text-color-secondary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {course.category}
                  </div>
                )}
                {course.level && (
                  <div className="flex items-center text-color-secondary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {course.level}
                  </div>
                )}
                {course.language && (
                  <div className="flex items-center text-color-secondary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {course.language}
                  </div>
                )}
              </div>

              {/* Instructor Info */}
              {course.instructor && (
                <div className="flex items-center space-x-6 mb-8">
                  <Link 
                    to={`/users/${course.instructor.id}`}
                    className="flex items-center group hover:opacity-90 transition-opacity"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={course.instructor.profilePictureUrl || '/default-avatar.png'}
                        alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                        className="h-14 w-14 rounded-full object-cover border-2 border-accent group-hover:border-accent-hover transition-colors"
                        onError={(e) => handleImageError(`instructor-${course.instructor?.id}`)}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-color-primary group-hover:text-accent transition-colors">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </h3>
                      <p className="text-sm text-color-secondary">{course.instructor.bio || 'Course Instructor'}</p>
                    </div>
                  </Link>
                  <div className="flex items-center">
                    <div className="flex items-center mr-6">
                      <svg className="w-5 h-5 text-accent mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-color-secondary">
                        {course.enrollments?.length || 0} students
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {course.price === 0 ? (
                        <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                          Free
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">${course.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Enrollment/Access Button */}
              {!isInstructor && !isUserEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full sm:w-auto px-8 py-4 bg-accent text-white rounded-lg hover:bg-accent-hover font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {enrolling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      Enroll Now
                      <svg className="ml-2 -mr-1 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Column - Course Thumbnail */}
            <div className="lg:w-[480px]">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={course.thumbnailUrl || '/default-course-thumbnail.jpg'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError('thumbnail')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <CourseContent
              courseId={Number(id)}
              isEnrolled={isInstructor || enrollmentStatus?.isEnrolled}
              isInstructor={isInstructor}
            />
          </div>
        </div>

        {/* Course Features */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* What you'll learn */}
          {course?.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-color-primary mb-4">What you'll learn</h2>
              <ul className="space-y-3">
                {course.whatYouWillLearn.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-accent mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-color-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* This course includes */}
          {course?.thisCourseInclude && course.thisCourseInclude.length > 0 && (
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold text-color-primary mb-4">This course includes</h2>
              <ul className="space-y-3">
                {course.thisCourseInclude.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-accent mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-color-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Course Messages */}
        <div className="mt-12">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-color-primary">Course Announcements</h2>
                {course.messages && course.messages.length > 0 && (
                  <span className="text-sm text-color-secondary bg-primary px-3 py-1 rounded-full">
                    {course.messages.length} {course.messages.length === 1 ? 'message' : 'messages'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {course.messages && course.messages.length > 0 ? (
                course.messages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-primary/50 transition-colors duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={message.instructor.profilePictureUrl || '/default-avatar.png'}
                          alt={`${message.instructor.firstName} ${message.instructor.lastName}`}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/20"
                          onError={(e) => handleImageError(`message-${message.id}`)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <p className="text-sm font-semibold text-color-primary">
                              {message.instructor.firstName} {message.instructor.lastName}
                            </p>
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
                              Instructor
                            </span>
                          </div>
                          <span className="text-xs text-color-secondary">
                            {new Date(message.sentAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-color-secondary whitespace-pre-wrap break-words leading-relaxed">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-color-primary">No announcements yet</p>
                  <p className="mt-1 text-sm text-color-secondary">Course announcements will appear here</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {isInstructor && (
              <div className="px-6 py-4 bg-primary border-t border-border">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write an announcement..."
                      className="w-full px-4 py-3 text-sm text-color-primary bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="absolute bottom-3 right-3">
                      <span className="text-xs text-color-secondary">
                        {newMessage.length}/1000
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                      Post Announcement
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 