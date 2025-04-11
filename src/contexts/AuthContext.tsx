import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  bio?: string;
  role: 'student' | 'instructor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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
      // Fetch user profile
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/api/Users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await API.post('/api/Users/login', { username, password });
      
      // Check if the login was successful
      if (response.data.isSuccess) {
        const { token, user, role } = response.data.data;
        
        localStorage.setItem('token', token);
        
        // Create a user object that includes the role
        const userData = {
          ...user,
          role: role.toLowerCase()
        };
        
        setUser(userData);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const registerStudent = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const response = await API.post('/api/Users/register/student', { 
        username, 
        email, 
        password,
        firstName,
        lastName
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      setUser(user);
    } catch (error) {
      console.error('Student registration failed:', error);
      throw error;
    }
  };

  const registerInstructor = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const response = await API.post('/api/Users/register/instructor', { 
        username, 
        email, 
        password,
        firstName,
        lastName
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      setUser(user);
    } catch (error) {
      console.error('Instructor registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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