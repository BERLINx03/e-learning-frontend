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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

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

  // Client-side filtering
  useEffect(() => {
    if (searchTerm || selectedCategory || selectedLevel) {
      const filtered = courses.filter(course => {
        const matchesSearch = searchTerm === '' || 
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === '' || course.category === selectedCategory;
        const matchesLevel = selectedLevel === '' || course.level === selectedLevel;
        
        return matchesSearch && matchesCategory && matchesLevel;
      });
      
      setFilteredCourses(filtered);
      setCurrentPage(1); // Reset to first page on new filter
    } else {
      setFilteredCourses(courses);
    }
  }, [searchTerm, selectedCategory, selectedLevel, courses]);

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
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current page of courses
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    
    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md border border-blue-200 bg-card text-color-primary hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        &laquo;
      </button>
    );
    
    // Calculate range of page numbers to display
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
    
    // Adjust if we're at the end of the range
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }
    
    // First page button if not visible
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded-md border border-blue-200 bg-card text-color-primary hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          1
        </button>
      );
      
      // Ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-3 py-1 text-color-secondary">
            ...
          </span>
        );
      }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'border border-blue-200 bg-card text-color-primary hover:bg-blue-50 hover:border-blue-300 transition-colors'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Last page button if not visible
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-3 py-1 text-color-secondary">
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded-md border border-blue-200 bg-card text-color-primary hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md border border-blue-200 bg-card text-color-primary hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        &raquo;
      </button>
    );
    
    return buttons;
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero section */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Next Skill</h1>
            <p className="text-xl text-white mb-8">
              Explore our collection of expert-taught courses and start learning today
            </p>
            <div className="relative max-w-xl">
              <input
                type="text"
                placeholder="What do you want to learn today?"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full py-3 px-4 pr-12 rounded-lg bg-white/10 backdrop-blur-sm text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-white/70"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="bg-error bg-opacity-20 border-l-4 border-error p-4 mb-8 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters section */}
        <div className="bg-gradient-to-r from-accent-light to-accent bg-opacity-10 rounded-xl shadow-md mb-8 overflow-hidden border border-accent-light">
          <div className="p-6 border-b border-accent-light bg-accent bg-opacity-10">
            <h2 className="text-lg font-semibold text-color-primary mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filter Courses
            </h2>
            <p className="text-sm text-color-secondary">Find the perfect course for your needs</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-1">
                <label htmlFor="category" className="block text-sm font-medium text-accent mb-1">Category</label>
                <div className="relative">
                  <select
                    id="category"
                    className="w-full rounded-lg bg-card border-accent-light text-color-primary shadow-sm focus:border-accent focus:ring-accent pl-4 pr-10 py-2 appearance-none"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-accent mb-1">Level</label>
                <div className="relative">
                  <select
                    id="level"
                    className="w-full rounded-lg bg-card border-accent-light text-color-primary shadow-sm focus:border-accent focus:ring-accent pl-4 pr-10 py-2 appearance-none"
                    value={selectedLevel}
                    onChange={handleLevelChange}
                  >
                    <option value="">All Levels</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 px-4 bg-card shadow-sm text-sm font-semibold rounded-lg text-accent border border-accent-light hover:bg-accent hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-color-primary">All Courses</h2>
            <p className="text-color-secondary">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-color-secondary text-lg">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-card rounded-xl shadow-md p-12 text-center border border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-color-primary">No courses found</h3>
              <p className="mt-2 text-color-secondary max-w-md mx-auto">
                We couldn't find any courses matching your search criteria. Try adjusting your filters or search term.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentCourses.map(course => (
                <div key={course.id} className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-primary flex flex-col">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full px-3 py-1 text-xs font-semibold">
                      {course.level}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-medium mb-2">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-bold text-color-primary mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-color-secondary text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="mt-auto">
                      {course.instructor && (
                        <div className="flex items-center mb-3">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800 mr-2">
                            {course.instructor.firstName.charAt(0)}{course.instructor.lastName.charAt(0)}
                          </div>
                          <span className="text-xs text-color-secondary">
                            {course.instructor.firstName} {course.instructor.lastName}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-primary">
                        <div className="text-lg font-bold text-blue-500">${course.price.toFixed(2)}</div>
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-blue-500 hover:text-blue-700 hover:underline text-sm font-medium transition-colors"
                        >
                          View Course →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredCourses.length > coursesPerPage && (
            <div className="mt-12 flex justify-center">
              <div className="flex space-x-1 bg-card p-2 rounded-lg shadow-md border border-blue-100">
                {renderPaginationButtons()}
              </div>
            </div>
          )}
          
          {/* Results count */}
          {!isLoading && filteredCourses.length > 0 && (
            <div className="mt-4 text-center text-sm text-color-secondary">
              Showing {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} of {filteredCourses.length} courses
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;