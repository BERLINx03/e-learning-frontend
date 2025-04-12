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
  uploadThumbnail: async (courseId: number | string, thumbnailFile: File): Promise<ApiResponse<string>> => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);
      
      // For FormData, we need to override the Content-Type to undefined so the browser sets it with the boundary
      const response = await API.put<ApiResponse<string>>(
        `/api/Courses/${courseId}/thumbnail`, 
        formData,
        {
          headers: {
            'Content-Type': undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to upload thumbnail for course ${courseId}:`, error);
      throw error;
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