import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../api/axios';
import ReportUserModal from './ReportUserModal';

interface InstructorCardProps {
  instructor: User;
  showReportButton?: boolean;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ 
  instructor, 
  showReportButton = true 
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!instructor) return null;

  const fullName = `${instructor.firstName} ${instructor.lastName}`;
  
  return (
    <>
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <Link 
          to={`/users/${instructor.id}`}
          className="block hover:opacity-90 transition-opacity"
        >
          <div className="p-4 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                <img 
                  src={instructor.profilePictureUrl || '/default-avatar.png'} 
                  alt={fullName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-color-primary truncate">
                {fullName}
              </h3>
              <p className="text-sm text-color-secondary truncate">
                Instructor
              </p>
            </div>
          </div>
        </Link>
        
        {showReportButton && (
          <div className="px-4 py-3 bg-secondary border-t border-primary">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Instructor
            </button>
          </div>
        )}
      </div>
      
      <ReportUserModal
        reportedUserId={instructor.id}
        reportedUserName={fullName}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};

export default InstructorCard; 