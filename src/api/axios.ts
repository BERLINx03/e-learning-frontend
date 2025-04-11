import axios from 'axios';

// Define response types
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  errors?: string[];
  data?: T;
  statusCode: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  instructorId: number;
  instructor?: any;
  lessons?: any[];
  enrollments?: any[];
  messages?: any[];
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

// Course API methods
export const CourseAPI = {
  // Get all courses
  getAllCourses: async (): Promise<ApiResponse<Course[]>> => {
    try {
      const response = await API.get<ApiResponse<Course[]>>('/api/Courses');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  },

  // Get course by ID
  getCourseById: async (courseId: number | string): Promise<ApiResponse<Course>> => {
    try {
      const response = await API.get<ApiResponse<Course>>(`/api/Courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch course with ID ${courseId}:`, error);
      throw error;
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
  }
};

export default API; 