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
    return Promise.reject(error);
  }
);

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  profilePictureUrl: string;
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
  updateCourse: async (courseId: number | string, courseData: Partial<Course>): Promise<ApiResponse<Course>> => {
    try {
      const response = await API.put<ApiResponse<Course>>(`/api/Courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update course with ID ${courseId}:`, error);
      throw error;
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
      formData.append('thumbnail', thumbnailFile);
      
      const response = await API.post<ApiResponse<string>>(
        `/api/Courses/${courseId}/thumbnail`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to upload thumbnail for course ${courseId}:`, error);
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
      const response = await API.post(`/api/Enrollments`, { courseId });
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

  // Mark a lesson as completed
  markLessonAsCompleted: async (lessonId: number): Promise<ApiResponse<Progress>> => {
    try {
      const response = await API.post(`/api/Progress/${lessonId}/complete`);
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
  sendCourseMessage: async (courseId: number, data: { message: string }): Promise<ApiResponse<CourseMessage>> => {
    try {
      const response = await API.post<ApiResponse<CourseMessage>>(`/api/Courses/${courseId}/messages`, data);
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

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse> => {
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

  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await API.get('/api/Users/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<User>;
      }
      return {
        isSuccess: false,
        message: 'An error occurred while fetching profile',
        statusCode: 500,
        data: undefined
      };
    }
  },

  // Create a new lesson
  createLesson: async (lessonData: Partial<Lesson>): Promise<ApiResponse<Lesson>> => {
    try {
      const response = await API.post<ApiResponse<Lesson>>('/api/Lessons', lessonData);
      return response.data;
    } catch (error) {
      console.error('Failed to create lesson:', error);
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
  }
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

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await API.put('/api/Users/profile', data);
      return {
        isSuccess: true,
        message: 'Profile updated successfully',
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isSuccess: false,
          message: error.response?.data?.message || 'Failed to update profile',
          statusCode: error.response?.status || 500,
          data: undefined
        };
      }
      return {
        isSuccess: false,
        message: 'An error occurred while updating profile',
        statusCode: 500,
        data: undefined
      };
    }
  }
};

export default API; 