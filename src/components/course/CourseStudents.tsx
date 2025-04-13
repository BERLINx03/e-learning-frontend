import React, { useState, useEffect } from 'react';
import { CourseAPI, User } from '../../api/axios';
import { toast } from 'react-hot-toast';

interface CourseStudentsProps {
  courseId: number;
}

const CourseStudents: React.FC<CourseStudentsProps> = ({ courseId }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.error('Error fetching students:', error);
      setError('An error occurred while fetching enrolled students');
      toast.error('An error occurred while fetching enrolled students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        <button 
          onClick={fetchStudents}
          className="mt-2 text-sm text-accent hover:text-accent-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-color-secondary text-sm">No students enrolled in this course yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <h3 className="text-lg font-medium text-color-primary mb-4">Enrolled Students ({students.length})</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-color-secondary uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-color-secondary uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-color-secondary uppercase tracking-wider">
                Profile
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {student.profilePictureUrl ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover"
                          src={student.profilePictureUrl}
                          alt={`${student.firstName} ${student.lastName}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random`;
                          }}
                        />
                      ) : (
                        <div 
                          className="h-10 w-10 rounded-full bg-accent-light flex items-center justify-center text-white font-bold"
                        >
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-color-primary">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-color-secondary">
                        @{student.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-color-primary">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a 
                    href={`/users/${student.id}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    View Profile
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseStudents; 