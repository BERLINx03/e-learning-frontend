import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/utilities.css';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profilePictureUrl]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close the profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Theme icon components
  const LightModeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  );

  const DarkModeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );

  const OnyxModeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path fillRule="evenodd" d="M2 9h16v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm10 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );

  const SystemModeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
    </svg>
  );

  // Function to get current theme icon
  const getThemeIcon = () => {
    switch (resolvedTheme) {
      case 'light':
        return <LightModeIcon />;
      case 'dark':
        return <DarkModeIcon />;
      case 'onyx':
        return <OnyxModeIcon />;
      default:
        return <LightModeIcon />;
    }
  };

  return (
    <nav className="bg-header shadow-theme sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                <span className="text-xl font-bold text-accent">E-Learning</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'border-accent text-text-primary' 
                    : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/courses"
                className={`${
                  isActive('/courses') 
                    ? 'border-accent text-text-primary' 
                    : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
              >
                Courses
              </Link>
              {isAuthenticated && user?.role === 'student' && (
                <Link
                  to="/my-courses"
                  className={`${
                    isActive('/my-courses') 
                      ? 'border-accent text-text-primary' 
                      : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  My Courses
                </Link>
              )}
              {isAuthenticated && user?.role === 'instructor' && (
                <>
                  <Link
                    to="/instructor-dashboard"
                    className={`${
                      isActive('/instructor-dashboard') 
                        ? 'border-accent text-text-primary' 
                        : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/instructor/courses"
                    className={`${
                      isActive('/instructor/courses') 
                        ? 'border-accent text-text-primary' 
                        : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    My Courses
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Theme Switcher */}
            <div className="ml-3 relative" ref={themeDropdownRef}>
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="bg-secondary p-2 rounded-full text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent theme-toggle transition-colors"
                aria-expanded={isThemeOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open theme menu</span>
                {getThemeIcon()}
              </button>
              
              {isThemeOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-theme py-1 bg-card ring-1 ring-border ring-opacity-5 focus:outline-none border border-border"
                  role="menu"
                  aria-orientation="vertical"
                  tabIndex={-1}
                >
                  <button
                    onClick={() => {
                      setTheme('light');
                      setIsThemeOpen(false);
                    }}
                    className={`${theme === 'light' ? 'bg-secondary text-text-primary' : 'text-text-secondary'} flex items-center w-full px-4 py-2 text-sm hover:bg-secondary transition-colors`}
                    role="menuitem"
                  >
                    <LightModeIcon />
                    <span className="ml-2">Light Mode</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setIsThemeOpen(false);
                    }}
                    className={`${theme === 'dark' ? 'bg-secondary text-text-primary' : 'text-text-secondary'} flex items-center w-full px-4 py-2 text-sm hover:bg-secondary transition-colors`}
                    role="menuitem"
                  >
                    <DarkModeIcon />
                    <span className="ml-2">Dark Mode</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTheme('onyx');
                      setIsThemeOpen(false);
                    }}
                    className={`${theme === 'onyx' ? 'bg-secondary text-text-primary' : 'text-text-secondary'} flex items-center w-full px-4 py-2 text-sm hover:bg-secondary transition-colors`}
                    role="menuitem"
                  >
                    <OnyxModeIcon />
                    <span className="ml-2">Onyx Mode</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTheme('system');
                      setIsThemeOpen(false);
                    }}
                    className={`${theme === 'system' ? 'bg-secondary text-text-primary' : 'text-text-secondary'} flex items-center w-full px-4 py-2 text-sm hover:bg-secondary transition-colors`}
                    role="menuitem"
                  >
                    <SystemModeIcon />
                    <span className="ml-2">Sync with OS</span>
                  </button>
                </div>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="ml-3 relative" ref={profileDropdownRef}>
                <div>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors p-2 hover:bg-secondary"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {!imageError && user?.profilePictureUrl ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={user.profilePictureUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent bg-opacity-10 flex items-center justify-center">
                        <span className="text-sm font-medium text-accent">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-text-primary">{user?.firstName} {user?.lastName}</span>
                  </button>
                </div>
                {isProfileOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-theme py-1 bg-card ring-1 ring-border ring-opacity-5 focus:outline-none border border-border"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                    tabIndex={-1}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-secondary transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      View Profile
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-secondary transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Update Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-secondary transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary transition-colors"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-text-primary hover:text-accent font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors shadow-theme"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/') 
                  ? 'border-accent text-accent bg-accent-50' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/courses"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/courses') 
                  ? 'border-accent text-accent bg-accent-50' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Courses
            </Link>
            {isAuthenticated && user?.role === 'student' && (
              <Link
                to="/my-courses"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/my-courses') 
                    ? 'border-accent text-accent bg-accent-50' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Courses
              </Link>
            )}
            {isAuthenticated && user?.role === 'instructor' && (
              <>
                <Link
                  to="/instructor-dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/instructor-dashboard') 
                      ? 'border-accent text-accent bg-accent-50' 
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/instructor/courses"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/instructor/courses') 
                      ? 'border-accent text-accent bg-accent-50' 
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Courses
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div>
                <div className="flex items-center px-4 py-2">
                  <div className="flex-shrink-0">
                    {!imageError && user?.profilePictureUrl ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.profilePictureUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Update Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 