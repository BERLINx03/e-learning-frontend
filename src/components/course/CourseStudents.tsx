import React, { useState, useEffect } from 'react';
import { User, CourseAPI } from '../../api/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface CourseStudentsProps {
  courseId: number;
}

const CourseStudents: React.FC<CourseStudentsProps> = ({ courseId }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CourseAPI.getCourseStudents(courseId);
      
      if (response.isSuccess && response.data) {
        setStudents(response.data);
      } else {
        setError(response.message || 'Failed to fetch enrolled students');
        toast.error(response.message || 'Failed to fetch enrolled students');
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      setError('An error occurred while fetching enrolled students');
      toast.error('An error occurred while fetching enrolled students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
        <p>{error}</p>
        <button 
          onClick={fetchStudents}
          className="mt-2 text-sm underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-4 text-color-secondary text-center border border-dashed border-gray-300 rounded-lg">
        <p>No students are currently enrolled in this course.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm">
      <div className="p-4 bg-secondary border-b border-primary">
        <h2 className="text-lg font-medium text-color-primary">Enrolled Students ({students.length})</h2>
      </div>
      
      <ul className="divide-y divide-primary">
        {students.map(student => (
          <li key={student.id} className="p-4 hover:bg-secondary transition-colors">
            <Link to={`/users/${student.id}`} className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={student.profilePictureUrl || '/default-avatar.png'} 
                    alt={`${student.firstName} ${student.lastName}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-color-primary truncate">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-xs text-color-secondary truncate">
                  {student.username}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseStudents; 