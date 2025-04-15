import axios from 'axios';

// Define response types
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  errors?: string[];
  data?: T;
  statusCode: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  role: "student" | "instructor" | "admin";
  timeoutUntil?: string;
  profilePictureUrl?: string;
  bio?: string;
}

export interface CourseMessage {
  id: number;
  courseId: number;
  instructorId: number;
  instructor: User;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface Progress {
  id: number;
  enrollmentId: number;
  lessonId: number;
  isCompleted: boolean;
  completedAt: string;
  quizScore: number;
}

export interface Certificate {
  id: number;
  enrollmentId: number;
  certificateUrl: string;
  issuedAt: string;
  certificateNumber: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  student: User;
  courseId: number;
  course?: Course;
  enrolledAt: string;
  isCompleted: boolean;
  completedAt: string;
  finalGrade: number;
  certificate?: Certificate;
  progress: Progress[];
}

export interface Answer {
  id: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  lessonId: number;
  questionText: string;
  points: number;
  answers: Answer[];
}

export interface Lesson {
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

export interface Course {
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
  studentCount: number;
  lessonCount: number;
}

const API = axios.create({
  baseURL: 'https://localhost:7104',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token in requests
API.interceptors.request.use(
  (config) => {
    console.log('Sending request:', config.method?.toUpperCase(), config.url, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle responses
API.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error.message || error);
    
    // Check for banned or timed out user
    if (error.response?.status === 401) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || '';
      
      // If the error message contains banned or suspended keywords
      if (errorMessage.toLowerCase().includes('banned') || errorMessage.toLowerCase().includes('suspended') || errorMessage.toLowerCase().includes('timeout')) {
        console.warn('User is banned or timed out:', errorMessage);
        
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        delete API.defaults.headers.common['Authorization'];
        
        // Redirect to login with error message
        window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
      }
    }
    
    return Promise.reject(error);
  }
);

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
}

// Course API methods
export const CourseAPI = {
  // Get all courses without pagination
  getAllCourses: async (): Promise<ApiResponse<Course[]>> => {
    try {
      const response = await API.get(`/api/Courses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return {
        isSuccess: false,
        message: 'Failed to fetch courses',
        errors: ['Network error while fetching courses'],
        statusCode: 500
      };
    }
  },
  
  // Get top enrolled courses
  getTopEnrolledCourses: async (limit: number = 6): Promise<ApiResponse<Course[]>> => {
    try {
      const response = await API.get(`/api/Courses/top-enrolled?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top enrolled courses:', error);
      return {
        isSuccess: false,
        message: 'Failed to fetch top enrolled courses',
        errors: ['Network error while fetching top enrolled courses'],
        statusCode: 500
      };
    }
  },
  
  // Search courses (client-side filtering should be implemented instead)
  searchCourses: async (
    searchTerm: string, 
    category?: string, 
    level?: string
  ): Promise<ApiResponse<Course[]>> => {
    try {
      // Simple GET request to fetch all courses, filtering will be done client-side
      const response = await API.get('/api/Courses');
      return response.data;
    } catch (error) {
      console.error('Error searching courses:', error);
      return {
        isSuccess: false,
        message: 'Failed to search courses',
        errors: ['Network error while searching courses'],
        statusCode: 500
      };
    }
  },

  // Get a specific course by ID with full details
  getCourseById: async (id: number): Promise<ApiResponse<Course>> => {
    try {
      const response = await API.get(`/api/Courses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch course',
        errors: ['Network error while fetching course'],
        statusCode: 500
      };
    }
  },

  // Create a new course
  createCourse: async (courseData: Partial<Course>): Promise<ApiResponse<Course>> => {
    try {
      const response = await API.post<ApiResponse<Course>>('/api/Courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    }
  },

  // Update a course
  updateCourse: async (courseId: number, courseData: {
    title?: string;
    description?: string;
    category?: string;
    level?: string;
    price?: number;
    isPublished?: boolean;
    whatYouWillLearn?: string[];
    thisCourseInclude?: string[];
    duration?: number;
    language?: string;
  }) => {
    try {
      const response = await API.put(`/api/Courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      return {
        isSuccess: false,
        message: 'Failed to update course',
        errors: [(error as any)?.message || 'Unknown error occurred'],
      };
    }
  },

  // Delete a course
  deleteCourse: async (courseId: number | string): Promise<ApiResponse<null>> => {
    try {
      const response = await API.delete<ApiResponse<null>>(`/api/Courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete course with ID ${courseId}:`, error);
      throw error;
    }
  },

  // Upload course thumbnail
  uploadThumbnail: async (courseId: number, thumbnailFile: File): Promise<ApiResponse<string>> => {
    try {
      const formData = new FormData();
      
      // Try both common field names as we're not sure which one the API expects
      formData.append('file', thumbnailFile);
      formData.append('thumbnail', thumbnailFile);
      formData.append('image', thumbnailFile);
      
      console.log('Uploading thumbnail for course ID:', courseId);
      console.log('File details:', {
        name: thumbnailFile.name,
        type: thumbnailFile.type,
        size: thumbnailFile.size,
      });
      
      // Set headers explicitly but with undefined for Content-Type to let Axios set the boundary
      const response = await API.post<ApiResponse<string>>(
        `/api/Courses/${courseId}/thumbnail`,
        formData,
        {
          headers: {
            'Content-Type': undefined,  // Let Axios set the proper multipart content type
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Thumbnail upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to upload thumbnail for course ${courseId}:`, error);
      if (axios.isAxiosError(error)) {
        console.log('Response headers:', error.response?.headers);
        console.log('Response data:', error.response?.data);
        console.log('Status code:', error.response?.status);
      }
      
      return {
        isSuccess: false,
        message: 'Failed to upload thumbnail',
        errors: ['Network error while uploading thumbnail'],
        statusCode: 500
      };
    }
  },

  // Get lessons for a specific course
  getLessonsByCourseId: async (courseId: number): Promise<ApiResponse<Lesson[]>> => {
    try {
      const response = await API.get(`/api/Lessons/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch lessons',
        errors: ['Network error while fetching lessons'],
        statusCode: 500
      };
    }
  },

  // Enroll in a course
  enrollInCourse: async (courseId: number): Promise<ApiResponse<Enrollment>> => {
    try {
      const response = await API.post(`/api/Courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      console.error(`Error enrolling in course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to enroll in course',
        errors: ['Network error while enrolling in course'],
        statusCode: 500
      };
    }
  },

  // Unenroll from a course
  unenrollFromCourse: async (courseId: number): Promise<ApiResponse<null>> => {
    try {
      const response = await API.post(`/api/Courses/${courseId}/unenroll`);
      return response.data;
    } catch (error) {
      console.error(`Error unenrolling from course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to unenroll from course',
        errors: ['Network error while unenrolling from course'],
        statusCode: 500
      };
    }
  },

  // Get lesson progress for a specific lesson
  getLessonProgress: async (lessonId: number): Promise<ApiResponse<Progress>> => {
    try {
      const response = await API.get(`/api/Lessons/${lessonId}/progress`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for lesson ${lessonId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch lesson progress',
        errors: ['Network error while fetching lesson progress'],
        statusCode: 500
      };
    }
  },

  // Get course progress percentage
  getCourseProgress: async (courseId: number): Promise<ApiResponse<number>> => {
    try {
      const response = await API.get(`/api/Lessons/course/${courseId}/progress`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch course progress',
        errors: ['Network error while fetching course progress'],
        statusCode: 500,
        data: 0
      };
    }
  },

  // Mark a lesson as completed
  markLessonAsCompleted: async (lessonId: number): Promise<ApiResponse<Progress>> => {
    try {
      const response = await API.post(`/api/Lessons/${lessonId}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error marking lesson ${lessonId} as completed:`, error);
      return {
        isSuccess: false,
        message: 'Failed to mark lesson as completed',
        errors: ['Network error while marking lesson as completed'],
        statusCode: 500
      };
    }
  },

  // Send a message in a course
  sendCourseMessage: async (courseId: number, message: string): Promise<ApiResponse<CourseMessage>> => {
    try {
      const response = await API.post<ApiResponse<CourseMessage>>(`/api/Courses/${courseId}/messages`, {
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Get all messages for a course
  getCourseMessages: async (courseId: number): Promise<ApiResponse<CourseMessage[]>> => {
    try {
      const response = await API.get<ApiResponse<CourseMessage[]>>(`/api/Courses/${courseId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },

  // Mark a message as read
  markMessageAsRead: async (courseId: number, messageId: number): Promise<ApiResponse<null>> => {
    try {
      const response = await API.put<ApiResponse<null>>(`/api/Courses/${courseId}/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  },

  // Create a new lesson
  createLesson: async (lessonData: Partial<Lesson>): Promise<ApiResponse<Lesson>> => {
    try {
      console.log('Creating lesson with data:', JSON.stringify(lessonData));
      
      if (!lessonData.courseId) {
        console.error('courseId is missing from lessonData');
        return {
          isSuccess: false,
          message: 'Course ID is required to create a lesson',
          statusCode: 400
        };
      }
      
      // Adding accept header explicitly
      const config = {
        headers: {
          'Accept': 'text/plain, application/json'
        }
      };
      
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token found');
      
      // Make sure to use the correct endpoint as shown in the successful curl example
      const response = await API.post<ApiResponse<Lesson>>('/api/Lessons', lessonData, config);
      console.log('Lesson creation successful with response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create lesson:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Status text:', error.response?.statusText);
        console.error('Response data:', error.response?.data);
        console.error('Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        });
        
        if (error.response?.status === 404) {
          return {
            isSuccess: false,
            message: 'Lesson endpoint not found (404). Check API URL and server status.',
            errors: ['API endpoint not found'],
            statusCode: 404
          };
        }
      }
      
      return {
        isSuccess: false,
        message: 'Failed to create lesson',
        errors: ['Network error while creating lesson'],
        statusCode: 500
      };
    }
  },

  // Update a lesson
  updateLesson: async (lessonId: number, lessonData: Partial<Lesson>): Promise<ApiResponse<Lesson>> => {
    try {
      const response = await API.put<ApiResponse<Lesson>>(`/api/Lessons/${lessonId}`, lessonData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update lesson with ID ${lessonId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to update lesson',
        errors: ['Network error while updating lesson'],
        statusCode: 500
      };
    }
  },

  // Delete a lesson
  deleteLesson: async (lessonId: number): Promise<ApiResponse<null>> => {
    try {
      const response = await API.delete<ApiResponse<null>>(`/api/Lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete lesson with ID ${lessonId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to delete lesson',
        errors: ['Network error while deleting lesson'],
        statusCode: 500
      };
    }
  },

  // Update lesson order (reordering)
  updateLessonOrder: async (lessonId: number, newOrder: number): Promise<ApiResponse<null>> => {
    try {
      const response = await API.put<ApiResponse<null>>(`/api/Lessons/${lessonId}/order`, { order: newOrder });
      return response.data;
    } catch (error) {
      console.error(`Failed to update order for lesson ${lessonId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to update lesson order',
        errors: ['Network error while updating lesson order'],
        statusCode: 500
      };
    }
  },

  // Get a specific lesson by ID
  getLessonById: async (id: number): Promise<ApiResponse<Lesson>> => {
    try {
      const response = await API.get(`/api/Lessons/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lesson ${id}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch lesson',
        errors: ['Network error while fetching lesson'],
        statusCode: 500
      };
    }
  },

  // Add/upload a video to a lesson
  addLessonVideo: async (lessonId: number, courseId: number, videoFile: File): Promise<ApiResponse<null>> => {
    try {
      const formData = new FormData();
      // Try different field names since we don't know which one the API expects
      formData.append('video', videoFile);
      formData.append('file', videoFile);
      
      console.log('Uploading video for lesson ID:', lessonId, 'in course ID:', courseId);
      console.log('Video file details:', {
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size,
      });
      
      try {
        // Try with Axios first
        const response = await API.put<ApiResponse<null>>(
          `/api/Lessons/${lessonId}/video/course/${courseId}`, 
          formData,
          {
            headers: {
              'Content-Type': undefined, // Let Axios set the correct content type with boundary
              'Accept': 'application/json'
            }
          }
        );
        return response.data;
      } catch (axiosError) {
        console.warn('Axios upload failed, trying XMLHttpRequest approach:', axiosError);
        
        // Fallback to XMLHttpRequest if Axios fails
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          
          xhr.open('PUT', `https://localhost:7104/api/Lessons/${lessonId}/video/course/${courseId}`, true);
          
          // Add authorization header
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.onload = function() {
            console.log('XHR Upload complete - status:', xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const responseData = JSON.parse(xhr.responseText);
                return resolve({
                  isSuccess: true,
                  message: 'Video uploaded successfully',
                  statusCode: xhr.status,
                  data: null
                });
              } catch (e) {
                return resolve({
                  isSuccess: true,
                  message: 'Video uploaded successfully but could not parse response',
                  statusCode: xhr.status,
                  data: null
                });
              }
            } else {
              return resolve({
                isSuccess: false,
                message: `Server error: ${xhr.statusText || 'Unknown error'}`,
                statusCode: xhr.status,
                errors: [`Status code: ${xhr.status}`],
                data: null
              });
            }
          };
          
          xhr.onerror = function() {
            console.error('XHR Network Error');
            return resolve({
              isSuccess: false,
              message: 'Network error while uploading video',
              statusCode: 0,
              errors: ['XHR request failed'],
              data: null
            });
          };
          
          xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
              const percent = (e.loaded / e.total) * 100;
              console.log(`Upload progress: ${percent.toFixed(1)}%`);
            }
          };
          
          // Create new FormData for XHR
          const xhrFormData = new FormData();
          xhrFormData.append('video', videoFile);
          xhrFormData.append('file', videoFile);
          
          xhr.send(xhrFormData);
        });
      }
    } catch (error) {
      console.error(`Failed to upload video for lesson ${lessonId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to upload video',
        errors: ['Network error while uploading video'],
        statusCode: 500,
        data: null
      };
    }
  },

  // Get students enrolled in a course
  getCourseStudents: async (courseId: number): Promise<ApiResponse<User[]>> => {
    try {
      const response = await API.get(`/api/Courses/${courseId}/students`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch enrolled students',
        errors: ['Network error while fetching students'],
        statusCode: 500
      };
    }
  },
  
  // Check if the current user is enrolled in a course
  getCourseEnrollmentStatus: async (courseId: number): Promise<ApiResponse<boolean>> => {
    try {
      const response = await API.get(`/api/Courses/${courseId}/enrollment-status`);
      return response.data;
    } catch (error) {
      console.error(`Error checking enrollment status for course ${courseId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to check enrollment status',
        errors: ['Network error while checking enrollment status'],
        statusCode: 500,
        data: false
      };
    }
  },
  
  // Get current user's courses (for instructor dashboard)
  getMyCourses: async (): Promise<ApiResponse<Course[]>> => {
    try {
      console.log('Calling /api/Courses/my-courses endpoint');
      const response = await API.get('/api/Courses/my-courses');
      console.log('Response from my-courses endpoint:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user courses:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      return {
        isSuccess: false,
        message: 'Failed to fetch your courses',
        errors: ['Network error while fetching courses'],
        statusCode: axios.isAxiosError(error) ? error.response?.status || 500 : 500,
        data: []
      };
    }
  },

  // Get enrolled courses for a user
  async getUserEnrollments(userId?: number): Promise<ApiResponse<Enrollment[]>> {
    if (userId !== undefined && (isNaN(userId) || userId <= 0)) {
      return {
        isSuccess: false,
        message: 'Invalid user ID provided',
        statusCode: 400,
        errors: ['The provided user ID is invalid'],
        data: []
      };
    }
    
    try {
      const endpoint = userId !== undefined && !isNaN(userId) && userId > 0
        ? `/api/Users/${userId}/enrollments` 
        : '/api/Users/profile/enrollments';
      
      console.log(`Fetching enrollments from: ${endpoint}`);
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to fetch enrollments',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: []
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while fetching enrollments',
        statusCode: 500,
        errors: ['Enrollment service is unavailable'],
        data: []
      };
    }
  },

  // Get courses for a user (created courses for instructors, enrolled courses for students)
  async getUserCourses(userId: number): Promise<ApiResponse<Course[]>> {
    if (isNaN(userId) || userId <= 0) {
      console.error('Invalid user ID provided for getUserCourses:', userId);
      return {
        isSuccess: false,
        message: 'Invalid user ID provided',
        statusCode: 400,
        errors: ['The provided user ID is invalid'],
        data: []
      };
    }
    
    try {
      const endpoint = `/api/Users/${userId}/courses`;
      console.log(`Fetching user courses from: ${endpoint}`);
      const response = await API.get(endpoint);
      
      console.log(`Successfully fetched courses for user ${userId}`, response.data);
      
      // Check if the response.data is already in the ApiResponse format
      if (response.data.hasOwnProperty('isSuccess')) {
        return response.data;
      }
      
      // If not, wrap the data in ApiResponse format
      return {
        isSuccess: true,
        message: 'User courses fetched successfully',
        statusCode: response.status,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching courses for user ${userId}:`, error);
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to fetch user courses',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: []
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while fetching user courses',
        statusCode: 500,
        errors: ['Course service is unavailable'],
        data: []
      };
    }
  },

  updateCourseThumbnail: async (courseId: number, thumbnailFile: File) => {
    try {
      // First try the Axios approach
      const formData = new FormData();
      
      // Try both common field names as we're not sure which one the API expects
      formData.append('file', thumbnailFile);
      formData.append('thumbnail', thumbnailFile);
      formData.append('image', thumbnailFile);
      
      console.log('Uploading thumbnail for course ID:', courseId);
      console.log('File details:', {
        name: thumbnailFile.name,
        type: thumbnailFile.type,
        size: thumbnailFile.size,
      });

      try {
        // Try first with Axios
        const response = await API.put(
          `/api/Courses/${courseId}/thumbnail`,
          formData,
          {
            headers: {
              'Content-Type': undefined,  // Let Axios set the proper multipart content type
              'Accept': 'application/json'
            }
          }
        );
        
        console.log('Thumbnail upload response:', response.data);
        return response.data;
      } catch (axiosError) {
        console.warn('Axios upload failed, trying XMLHttpRequest approach:', axiosError);
        
        // If Axios fails, try XMLHttpRequest as fallback
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          
          xhr.open('PUT', `https://localhost:7104/api/Courses/${courseId}/thumbnail`, true);
          
          // Add authorization header
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.onload = function() {
            console.log('XHR Upload complete - status:', xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const responseData = JSON.parse(xhr.responseText);
                console.log('Parsed XHR response:', responseData);
                resolve({
                  isSuccess: true,
                  message: 'Thumbnail uploaded successfully',
                  data: responseData.data
                });
              } catch (e) {
                console.error('Error parsing XHR response:', e);
                resolve({
                  isSuccess: true,
                  message: 'Thumbnail uploaded successfully but could not parse response',
                  data: xhr.responseText
                });
              }
            } else {
              console.error('XHR Server returned error status:', xhr.status);
              resolve({
                isSuccess: false,
                message: `Server error: ${xhr.statusText || 'Unknown error'}`,
                errors: [`Status code: ${xhr.status}`]
              });
            }
          };
          
          xhr.onerror = function() {
            console.error('XHR Network Error');
            resolve({
              isSuccess: false,
              message: 'Network error while uploading thumbnail',
              errors: ['XHR request failed']
            });
          };
          
          xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
              const percent = (e.loaded / e.total) * 100;
              console.log(`Upload progress: ${percent.toFixed(1)}%`);
            }
          };
          
          // Create and send FormData
          const xhrFormData = new FormData();
          xhrFormData.append('file', thumbnailFile); 
          xhrFormData.append('thumbnail', thumbnailFile);
          xhrFormData.append('image', thumbnailFile);
          
          xhr.send(xhrFormData);
        });
      }
    } catch (error) {
      console.error('Error updating course thumbnail:', error);
      if (axios.isAxiosError(error)) {
        console.log('Response headers:', error.response?.headers);
        console.log('Response data:', error.response?.data);
        console.log('Status code:', error.response?.status);
      }
      
      return {
        isSuccess: false,
        message: 'Failed to update course thumbnail',
        errors: [(error as any)?.message || 'Unknown error occurred'],
      };
    }
  },
};

export const UserAPI = {
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await API.get('/api/Users/profile');
      return {
        isSuccess: true,
        message: 'Profile fetched successfully',
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to fetch profile',
          statusCode: error.response?.status || 500,
          data: undefined
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while fetching profile',
        statusCode: 500,
        data: undefined
      };
    }
  },

  async getUserById(userId: number): Promise<ApiResponse<User>> {
    try {
      const response = await API.get(`/api/Users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user profile with ID ${userId}:`, error);
      return {
        isSuccess: false,
        message: 'Failed to fetch user profile',
        errors: ['Network error while fetching user profile'],
        statusCode: 500
      };
    }
  },

  async registerStudent(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Create the payload with the exact keys expected by the API
      const payload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      
      console.log('Sending student registration request with payload:', payload);
      const response = await API.post('/api/Users/register/student', payload);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to register student',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: undefined
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while registering',
        statusCode: 500,
        errors: ['Registration service is unavailable'],
        data: undefined
      };
    }
  },

  async registerInstructor(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Create the payload with the exact keys expected by the API
      const payload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      
      console.log('Sending instructor registration request with payload:', payload);
      const response = await API.post('/api/Users/register/instructor', payload);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to register instructor',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: undefined
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while registering',
        statusCode: 500,
        errors: ['Registration service is unavailable'],
        data: undefined
      };
    }
  },

  // Report a user
  async reportUser(reportData: { 
    reportedUserId: number, 
    reason: string, 
    details: string 
  }): Promise<ApiResponse<any>> {
    try {
      const response = await API.post('/api/UserReports', reportData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to submit report',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: undefined
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while submitting the report',
        statusCode: 500,
        errors: ['Report service is unavailable'],
        data: undefined
      };
    }
  },

  // Get enrolled courses for a user
  async getUserEnrollments(userId?: number): Promise<ApiResponse<Enrollment[]>> {
    if (userId !== undefined && (isNaN(userId) || userId <= 0)) {
      return {
        isSuccess: false,
        message: 'Invalid user ID provided',
        statusCode: 400,
        errors: ['The provided user ID is invalid'],
        data: []
      };
    }
    
    try {
      const endpoint = userId !== undefined && !isNaN(userId) && userId > 0
        ? `/api/Users/${userId}/enrollments` 
        : '/api/Users/profile/enrollments';
      
      console.log(`Fetching enrollments from: ${endpoint}`);
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to fetch enrollments',
          statusCode: error.response?.status || 500,
          errors: error.response?.data?.errors || ['An unknown error occurred'],
          data: []
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while fetching enrollments',
        statusCode: 500,
        errors: ['Enrollment service is unavailable'],
        data: []
      };
    }
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse> {
    try {
      const response = await API.put('/api/Users/profile', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse;
      }
      return {
        isSuccess: false,
        message: 'An error occurred while updating profile',
        statusCode: 500
      };
    }
  },

  async uploadProfilePicture(imageFile: File): Promise<ApiResponse<string>> {
    return new Promise((resolve) => {
      console.log('Uploading profile picture with simplified approach:', imageFile.name);
      
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = false; // Try without credentials
      
      // Log all XMLHttpRequest events
      xhr.onreadystatechange = function() {
        console.log(`XHR state change: readyState=${xhr.readyState}, status=${xhr.status}`);
      };
      
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          console.log(`Upload progress: ${percentComplete.toFixed(2)}%`);
        }
      };
      
      xhr.open('PUT', 'https://localhost:7104/api/Users/profile/picture', true);
      
      // Add authorization header
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        console.log('XHR Response complete - status:', xhr.status);
        console.log('XHR Response headers:', xhr.getAllResponseHeaders());
        console.log('XHR Response text:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            console.log('Parsed response data:', responseData);
            resolve({
              isSuccess: true,
              message: 'Profile picture uploaded successfully',
              data: responseData.data || '',
              statusCode: xhr.status
            });
          } catch (error) {
            console.error('Error parsing response:', error);
            
            // If parsing failed but status is success, use the raw response
            if (xhr.responseText && xhr.responseText.length > 0) {
              resolve({
                isSuccess: true,
                message: 'Profile picture uploaded successfully',
                data: xhr.responseText,
                statusCode: xhr.status
              });
            } else {
              resolve({
                isSuccess: false,
                message: 'Error parsing server response',
                statusCode: xhr.status,
                data: ''
              });
            }
          }
        } else {
          console.error('Server returned error status:', xhr.status);
          resolve({
            isSuccess: false,
            message: 'Server error: ' + xhr.statusText,
            statusCode: xhr.status,
            data: ''
          });
        }
      };
      
      xhr.onerror = function(e) {
        console.error('XHR Network Error:', e);
        resolve({
          isSuccess: false,
          message: 'Network error while uploading profile picture',
          statusCode: 0,
          data: ''
        });
      };
      
      // Create basic FormData
      const formData = new FormData();
      formData.append('picture', imageFile);
      
      // Log what we're sending
      console.log('Sending file:', imageFile.name, imageFile.type, imageFile.size);
      
      // Send the request
      xhr.send(formData);
    });
  },

  // Check user status (for ban/timeout detection)
  async checkUserStatus(): Promise<ApiResponse<{isActive: boolean, isBanned?: boolean, timeoutUntil?: string, canLogin?: boolean}>> {
    try {
      const response = await API.get('/api/Users/status');
      return response.data;
    } catch (error) {
      console.error('Error checking user status:', error);
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to check user status',
          statusCode: error.response?.status || 500,
          data: { isActive: true } // Default to active in case of error
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while checking user status',
        statusCode: 500,
        data: { isActive: true }
      };
    }
  },
};

export default API; 