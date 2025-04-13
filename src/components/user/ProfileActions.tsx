import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportUserModal from './ReportUserModal';

interface ProfileActionsProps {
  profileUserId: number | string;
  profileUserName: string;
  canEdit?: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ 
  profileUserId, 
  profileUserName,
  canEdit = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Convert profileUserId to number for comparison (API expects number)
  const userId = typeof profileUserId === 'string' ? parseInt(profileUserId, 10) : profileUserId;
  
  // Determine if this is the logged-in user's own profile
  const isOwnProfile = user?.id === userId;

  if (!user) return null;

  return (
    <>
      <div className="flex space-x-2">
        {canEdit && isOwnProfile && (
          <button
            onClick={() => navigate('/profile/edit')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
        
        {!isOwnProfile && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Report User
          </button>
        )}
      </div>
      
      {!isOwnProfile && (
        <ReportUserModal
          reportedUserId={userId}
          reportedUserName={profileUserName}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProfileActions; 