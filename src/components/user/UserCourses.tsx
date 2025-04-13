import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserAPI, CourseAPI, Course } from '../../api/axios';

interface UserCoursesProps {
  userId?: number;
  isOwnProfile?: boolean;
  userRole?: string;
}

const UserCourses: React.FC<UserCoursesProps> = ({ userId, isOwnProfile = false, userRole = 'student' }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Determine title based on user role and if it's own profile
  const getTitle = () => {
    if (userRole.toLowerCase() === 'instructor') {
      return isOwnProfile ? 'My Created Courses' : 'Created Courses';
    } else {
      return isOwnProfile ? 'My Enrolled Courses' : 'Enrolled Courses';
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserCourses(userId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserCourses = async (id: number) => {
    if (!id || isNaN(id)) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await CourseAPI.getUserCourses(id);
      
      if (response.isSuccess && response.data) {
        setCourses(response.data);
      } else {
        // Just log error but don't show to user
        console.error(response.message || 'Failed to fetch user courses');
      }
    } catch (error) {
      console.error('Error fetching user courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg overflow-hidden border border-primary">
        <div className="p-4 bg-secondary border-b border-primary">
          <h2 className="text-lg font-medium text-color-primary">
            {getTitle()}
          </h2>
        </div>
        <div className="p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            <p className="mt-4 text-color-secondary">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we have data to show
  const hasData = courses.length > 0;

  if (!hasData) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border border-primary">
        <svg className="mx-auto h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-color-primary">
          {userRole.toLowerCase() === 'instructor' ? 
            (isOwnProfile ? "You haven't created any courses yet" : "This instructor hasn't created any courses yet") :
            (isOwnProfile ? "You're not enrolled in any courses yet" : "This user isn't enrolled in any courses yet")}
        </h3>
        {isOwnProfile && userRole.toLowerCase() === 'student' && (
          <p className="mt-1 text-color-secondary">
            Explore our course catalog to find something that interests you.
          </p>
        )}
        {isOwnProfile && userRole.toLowerCase() === 'instructor' && (
          <p className="mt-1 text-color-secondary">
            Create your first course to share your knowledge with students.
          </p>
        )}
        {isOwnProfile && (
          <div className="mt-6">
            {userRole.toLowerCase() === 'student' ? (
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover"
              >
                Browse Courses
              </Link>
            ) : (
              <Link
                to="/instructor/new-course"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover"
              >
                Create Course
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-primary overflow-hidden">
      <div className="p-4 bg-secondary border-b border-primary">
        <h2 className="text-lg font-medium text-color-primary">
          {getTitle()}
          <span className="ml-2 text-sm text-color-secondary">
            ({courses.length})
          </span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {courses.map((course) => (
          <Link 
            key={course.id} 
            to={`/courses/${course.id}`}
            className="block bg-primary rounded-lg overflow-hidden border border-primary hover:shadow-md transition-shadow"
          >
            <div className="relative pb-[56.25%] bg-secondary">
              {course.thumbnailUrl ? (
                <img 
                  src={course.thumbnailUrl} 
                  alt={course.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-12 w-12 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-color-primary mb-1 line-clamp-2">
                {course.title}
              </h3>
              <div className="text-xs text-color-secondary mb-2">
                {course.category} • {course.level}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UserCourses;