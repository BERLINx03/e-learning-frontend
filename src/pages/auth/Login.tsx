import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error message in URL query parameters (for redirects from ban/timeout detection)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorMessage = queryParams.get('error');
    
    if (errorMessage) {
      // Set the error message from URL
      if (errorMessage.includes('banned')) {
        setError(
          <div>
            <p className="font-medium mb-2">{errorMessage}</p>
            <p className="text-sm">
              Please contact support at{' '}
              <a href="mailto:abdallahelsokkary4399@gmail.com" className="text-accent hover:underline">
                abdallahelsokkary4399@gmail.com
              </a>
            </p>
          </div>
        );
      } else if (errorMessage.includes('suspended') || errorMessage.includes('timeout')) {
        // Extract the suspension end date from the message if it exists
        const dateMatch = errorMessage.match(/until\s+([^\.]+)/);
        if (dateMatch) {
          setError(
            <div>
              <p className="font-medium mb-2">{errorMessage}</p>
              <p className="text-sm">
                Your account will be automatically reactivated on {dateMatch[1]}.
              </p>
            </div>
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
      
      // Clear the URL parameter without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    console.log('Login attempt with:', { username, password });

    try {
      const result = await login(username, password);
      console.log('Login result:', result);
      
      if (result.isSuccess) {
        // Extract role from the response
        const role = result.data.role.toLowerCase();
        console.log('User role:', role);
        
        // Redirect based on user role
        if (role === 'instructor') {
          navigate('/instructor-dashboard');
        } else if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/'); // Default to home for students
        }
      } else {
        console.error('Login failed with message:', result.message);
        setError(result.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      
      // Check for banned or suspended account messages
      if (err.response?.data?.errors?.length > 0) {
        const errorMessage = err.response.data.errors[0];
        
        if (errorMessage.includes('banned')) {
          setError(
            <div>
              <p className="font-medium mb-2">{errorMessage}</p>
              <p className="text-sm">
                Please contact support at{' '}
                <a href="mailto:abdallahelsokkary4399@gmail.com" className="text-accent hover:underline">
                  abdallahelsokkary4399@gmail.com
                </a>
              </p>
            </div>
          );
        } else if (errorMessage.includes('suspended')) {
          // Extract the suspension end date from the message
          const dateMatch = errorMessage.match(/until\s+([^\.]+)/);
          if (dateMatch) {
            setError(
              <div>
                <p className="font-medium mb-2">{errorMessage}</p>
                <p className="text-sm">
                  Your account will be automatically reactivated on {dateMatch[1]}.
                </p>
              </div>
            );
          } else {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-theme border border-border">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-text-primary">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link to="/register" className="font-medium text-accent hover:text-accent hover:underline transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-danger bg-opacity-10 border border-danger px-4 py-3 rounded-md" role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 text-text-primary">
                {typeof error === 'string' ? (
                  <div className="space-y-2">
                    <div className="font-medium">{error}</div>
                    {error.includes('banned') && (
                      <div className="text-sm">
                        <p className="mb-2">Your account has been permanently banned from the platform.</p>
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <a href="mailto:abdallahelsokkary4399@gmail.com" className="text-accent hover:text-accent hover:underline">
                            Contact Support
                          </a>
                        </div>
                      </div>
                    )}
                    {error.includes('suspended') && (
                      <div className="text-sm">
                        <p className="mb-2">Your account is temporarily suspended.</p>
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>Account will be reactivated on {error.match(/until\s+([^\.]+)/)?.[1]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  error
                )}
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-input-border bg-input rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary text-sm transition-colors"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-input-border bg-input text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm transition-colors"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-accent border-input-border rounded focus:ring-accent transition-colors"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-accent hover:text-accent hover:underline transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-150 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              <span>Sign in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 