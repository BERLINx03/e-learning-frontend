import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API, { UserAPI } from '../api/axios';

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

type AuthContextType = {
  user: User | null;
  updateUser: (user: User | Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  registerStudent: (firstName: string, lastName: string, username: string, email: string, password: string) => Promise<void>;
  registerInstructor: (firstName: string, lastName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<User | undefined>;
};

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
    const storedUserData = localStorage.getItem('userData');
    
    if (token) {
      // Set default authorization header
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // First try to use stored user data
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          
          // Validate role type
          if (parsedData && parsedData.role) {
            const roleLower = typeof parsedData.role === 'string' 
              ? parsedData.role.toLowerCase() 
              : 'student';
            
            // Ensure role is one of the allowed values
            if (roleLower === 'student' || roleLower === 'instructor' || roleLower === 'admin') {
              // Create a properly typed user object
              const userData: User = {
                id: parsedData.id,
                username: parsedData.username,
                email: parsedData.email,
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
                profilePictureUrl: parsedData.profilePictureUrl || '',
                bio: parsedData.bio || '',
                role: roleLower as 'student' | 'instructor' | 'admin'
              };
              
              setUser(userData);
              console.log('Restored user from localStorage:', userData);
              setIsLoading(false);
            } else {
              console.error('Invalid role in stored user data:', parsedData.role);
              fetchUserProfile();
            }
          } else {
            console.error('No role found in stored user data');
            fetchUserProfile();
          }
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          // If parsing fails, fetch from API
          fetchUserProfile();
        }
      } else {
        // If no stored data, fetch from API
        fetchUserProfile();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile from API...');
      
      // Force fresh data by adding a cache-busting timestamp
      const response = await API.get(`/api/Users/profile?t=${new Date().getTime()}`);
      
      console.log('Profile response:', JSON.stringify(response.data));
      
      // Check if response.data exists
      if (!response.data) {
        throw new Error('No data received from profile API');
      }
      
      // Determine role with fallback to student
      let role: 'student' | 'instructor' | 'admin' = 'student';
      if (response.data.role && typeof response.data.role === 'string') {
        const roleLower = response.data.role.toLowerCase();
        if (roleLower === 'student' || roleLower === 'instructor' || roleLower === 'admin') {
          role = roleLower as 'student' | 'instructor' | 'admin';
        }
      }
      
      // Create a properly typed User object
      const userData: User = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        profilePictureUrl: response.data.profilePictureUrl || '',
        bio: response.data.bio || '',
        role: role
      };
      
      console.log('Setting user data from profile:', userData);
      
      // Store in localStorage for persistence and force overwrite
      localStorage.removeItem('userData');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Update the user state
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Clear authentication data on error
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      delete API.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await API.post('/api/Users/login', { username, password });
      
      console.log('Login response:', JSON.stringify(response.data));
      
      if (response.data.isSuccess) {
        const { token } = response.data.data;
        
        // Check if user data exists in the expected structure
        if (!response.data.data.user) {
          console.error('User data missing in login response');
          throw new Error('Invalid login response format');
        }
        
        // Check where the role information is located
        let role: 'student' | 'instructor' | 'admin' = 'student'; // Default role
        if (response.data.data.role && typeof response.data.data.role === 'string') {
          const roleLower = response.data.data.role.toLowerCase();
          if (roleLower === 'student' || roleLower === 'instructor' || roleLower === 'admin') {
            role = roleLower as 'student' | 'instructor' | 'admin';
          }
        } else if (response.data.data.user.role && typeof response.data.data.user.role === 'string') {
          const roleLower = response.data.data.user.role.toLowerCase();
          if (roleLower === 'student' || roleLower === 'instructor' || roleLower === 'admin') {
            role = roleLower as 'student' | 'instructor' | 'admin';
          }
        }
        
        // Create a properly typed User object
        const userData: User = {
          id: response.data.data.user.id,
          username: response.data.data.user.username,
          email: response.data.data.user.email,
          firstName: response.data.data.user.firstName,
          lastName: response.data.data.user.lastName,
          profilePictureUrl: response.data.data.user.profilePictureUrl || '',
          bio: response.data.data.user.bio || '',
          role: role
        };
        
        console.log('Setting user data:', userData);
        
        localStorage.setItem('token', token);
        // Also store the user data in localStorage to persist across refreshes
        localStorage.setItem('userData', JSON.stringify(userData));
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
      const response = await UserAPI.registerStudent({ 
        firstName, 
        lastName, 
        username, 
        email, 
        password 
      });
      
      console.log('Student registration response:', response);
      
      if (response.isSuccess) {
        // Handle different response structures
        if (response.data) {
          // Check if response has token and user properties
          if (response.data.token && response.data.user) {
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePictureUrl: user.profilePictureUrl || '',
              bio: user.bio || '',
              role: 'student'
            });
          } else if (typeof response.data === 'string') {
            // If response.data is just a token string
            const token = response.data;
            localStorage.setItem('token', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // We'll need to fetch user profile separately
            await fetchUserProfile();
          } else {
            console.warn('Unexpected response structure, trying to fetch user profile');
            await fetchUserProfile();
          }
        } else {
          console.warn('Response successful but no data returned, trying to fetch user profile');
          await fetchUserProfile();
        }
      } else {
        const errorMessage = response.message || 
                             (response.errors && response.errors.length > 0 ? response.errors[0] : 'Registration failed');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Student registration failed:', error);
      throw error;
    }
  };

  const registerInstructor = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const response = await UserAPI.registerInstructor({ 
        firstName, 
        lastName, 
        username, 
        email, 
        password 
      });
      
      console.log('Instructor registration response:', response);
      
      if (response.isSuccess) {
        // Handle different response structures
        if (response.data) {
          // Check if response has token and user properties
          if (response.data.token && response.data.user) {
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePictureUrl: user.profilePictureUrl || '',
              bio: user.bio || '',
              role: 'instructor'
            });
          } else if (typeof response.data === 'string') {
            // If response.data is just a token string
            const token = response.data;
            localStorage.setItem('token', token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // We'll need to fetch user profile separately
            await fetchUserProfile();
          } else {
            console.warn('Unexpected response structure, trying to fetch user profile');
            await fetchUserProfile();
          }
        } else {
          console.warn('Response successful but no data returned, trying to fetch user profile');
          await fetchUserProfile();
        }
      } else {
        const errorMessage = response.message || 
                             (response.errors && response.errors.length > 0 ? response.errors[0] : 'Registration failed');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Instructor registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    console.log('User logged out, all auth data cleared');
  };

  const updateUser = (updatedUser: User | Partial<User>) => {
    console.log('Updating user with new data:', updatedUser);
    
    // Preserve the token when updating user
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Ensure role is typed correctly if it exists
    if (updatedUser && 'role' in updatedUser) {
      const role = typeof updatedUser.role === 'string' ? updatedUser.role.toLowerCase() : null;
      
      // Only accept valid role values
      if (role === 'student' || role === 'instructor' || role === 'admin') {
        // If it's a complete user object, set it directly
        if ('id' in updatedUser && 'username' in updatedUser && 'email' in updatedUser) {
          setUser({
            ...updatedUser,
            role: role as 'student' | 'instructor' | 'admin'
          } as User);
          
          // Update localStorage too
          localStorage.setItem('userData', JSON.stringify({
            ...updatedUser,
            role: role
          }));
        } else if (user) {
          // It's a partial update, merge with existing user
          const updatedUserData = {
            ...user,
            ...updatedUser,
            role: role as 'student' | 'instructor' | 'admin'
          };
          setUser(updatedUserData);
          
          // Update localStorage too
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
      } else {
        console.error('Invalid role value:', updatedUser.role);
      }
    } else if (user && updatedUser) {
      // No role update, just merge other properties
      const updatedUserData = { ...user, ...updatedUser };
      setUser(updatedUserData);
      
      // Update localStorage too
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
    }
  };

  const value = {
    user,
    updateUser,
    isAuthenticated: !!user,
    isLoading,
    login,
    registerStudent,
    registerInstructor,
    logout,
    fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 