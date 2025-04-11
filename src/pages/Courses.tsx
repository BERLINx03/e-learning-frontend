import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CourseAPI, Course } from '../api/axios';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await CourseAPI.getAllCourses();
      
      if (response.isSuccess && response.data) {
        // Only show published courses
        const publishedCourses = response.data.filter(course => course.isPublished);
        setCourses(publishedCourses);
        setFilteredCourses(publishedCourses);
        
        // Extract unique categories and levels
        const uniqueCategories = Array.from(new Set(publishedCourses.map(course => course.category)));
        const uniqueLevels = Array.from(new Set(publishedCourses.map(course => course.level)));
        
        setCategories(uniqueCategories);
        setLevels(uniqueLevels);
      } else {
        setError(response.message || 'Failed to fetch courses');
        console.error('Failed to fetch courses:', response.message);
      }
    } catch (error) {
      setError('Failed to fetch courses. Please try again.');
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search - only search when user stops typing for 500ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm || selectedCategory || selectedLevel) {
        searchCourses();
      } else {
        // If no search criteria, show all courses
        setFilteredCourses(courses);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, selectedLevel]);

  const searchCourses = async () => {
    // Only call API if search term exists, otherwise filter locally
    if (searchTerm.length > 2) {
      setIsSearching(true);
      try {
        const response = await CourseAPI.searchCourses(
          searchTerm, 
          selectedCategory, 
          selectedLevel
        );
        
        if (response.isSuccess && response.data) {
          const publishedCourses = response.data.filter(course => course.isPublished);
          setFilteredCourses(publishedCourses);
        } else {
          console.error('Search failed:', response.message);
          // Fall back to local filtering if API search fails
          filterCoursesLocally();
        }
      } catch (error) {
        console.error('Error searching courses:', error);
        // Fall back to local filtering if API search fails
        filterCoursesLocally();
      } finally {
        setIsSearching(false);
      }
    } else {
      // For short search terms, filter locally
      filterCoursesLocally();
    }
  };

  const filterCoursesLocally = () => {
    let filtered = [...courses];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(search) || 
        course.description.toLowerCase().includes(search)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }
    
    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }
    
    setFilteredCourses(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setFilteredCourses(courses);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Explore Courses</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filters */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                id="level"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedLevel}
                onChange={handleLevelChange}
              >
                <option value="">All Levels</option>
                {levels.map((level, index) => (
                  <option key={index} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Course Listings */}
        {isLoading || isSearching ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {course.level}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{course.title}</h3>
                    <span className="text-lg font-bold text-blue-600">${course.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center mb-4">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{course.category}</span>
                    {course.instructor && (
                      <span className="text-xs text-gray-500 ml-2">by {course.instructor.firstName} {course.instructor.lastName}</span>
                    )}
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="block w-full text-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 