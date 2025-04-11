import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../api/axios';

interface User {
  id: string | number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  bio?: string;
  role: 'student' | 'instructor' | 'admin';
}

interface LoginResponse {
  isSuccess: boolean;
  message: string;
  errors: string[];
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      profilePictureUrl: string;
      bio: string;
    };
    token: string;
    role: string;
  };
  statusCode: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  registerStudent: (firstName: string, lastName: string, username: string, email: string, password: string) => Promise<void>;
  registerInstructor: (firstName: string, lastName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Set default authorization header
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user profile
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/api/Users/profile');
      setUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        profilePictureUrl: response.data.profilePictureUrl,
        bio: response.data.bio,
        role: response.data.role.toLowerCase()
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await API.post('/api/Users/login', { username, password });
      
      if (response.data.isSuccess) {
        const { token } = response.data.data;
        const userData = {
          id: response.data.data.user.id,
          username: response.data.data.user.username,
          email: response.data.data.user.email,
          firstName: response.data.data.user.firstName,
          lastName: response.data.data.user.lastName,
          profilePictureUrl: response.data.data.user.profilePictureUrl,
          bio: response.data.data.user.bio,
          role: response.data.data.role.toLowerCase()
        };
        
        localStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const registerStudent = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const response = await API.post('/api/Users/register/student', { 
        firstName, 
        lastName, 
        username, 
        email, 
        password 
      });
      
      if (response.data.isSuccess) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl,
          bio: user.bio,
          role: 'student'
        });
      }
    } catch (error) {
      console.error('Student registration failed:', error);
      throw error;
    }
  };

  const registerInstructor = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const response = await API.post('/api/Users/register/instructor', { 
        firstName, 
        lastName, 
        username, 
        email, 
        password 
      });
      
      if (response.data.isSuccess) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl,
          bio: user.bio,
          role: 'instructor'
        });
      }
    } catch (error) {
      console.error('Instructor registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    registerStudent,
    registerInstructor,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 