import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserAPI } from '../api/axios';
import ProfileActions from '../components/user/ProfileActions';
import UserCourses from '../components/user/UserCourses';
import MyCoursesTester from '../components/user/MyCoursesTester';
import { toast } from 'react-hot-toast';

interface ProfileProps {
  userId?: string; // Optional prop to view another user's profile
}

const Profile: React.FC<ProfileProps> = ({ userId: propUserId }) => {
  const { user: currentUser, isLoading } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState(currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Report user state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Determine which user ID to use
  const userId = propUserId || paramUserId || (currentUser ? currentUser.id : null);
  const numericUserId = userId ? Number(userId) : undefined;
  const isOwnProfile = currentUser && numericUserId === currentUser.id;

  useEffect(() => {
    // If viewing own profile, use currentUser data
    if (isOwnProfile && currentUser) {
      setProfileUser(currentUser);
      return;
    }
    
    // If viewing another user's profile, fetch their data
    if (userId && !isNaN(Number(userId))) {
      fetchUserProfile(userId);
    }
  }, [userId, currentUser, isOwnProfile]);

  const fetchUserProfile = async (id: string | number) => {
    try {
      setLoading(true);
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        setError('Invalid user ID');
        return;
      }
      
      const response = await UserAPI.getUserById(numericId);
      
      if (response.isSuccess && response.data) {
        setProfileUser(response.data);
      } else {
        setError(response.message || 'User profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !reportDetails.trim()) {
      toast.error('Please provide both a reason and details for your report');
      return;
    }
    
    if (!numericUserId || isNaN(numericUserId)) {
      toast.error('Invalid user ID');
      return;
    }
    
    try {
      setIsSubmittingReport(true);
      
      const reportData = {
        reportedUserId: numericUserId,
        reason: reportReason.trim(),
        details: reportDetails.trim()
      };
      
      const response = await UserAPI.reportUser(reportData);
      
      if (response.isSuccess) {
        toast.success(response.message || 'Report submitted successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      } else {
        toast.error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('An error occurred while submitting your report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-color-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-primary flex justify-center items-center">
        <div className="text-center">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p>{error || 'User profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="bg-secondary py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-color-primary">Profile</h1>
              <p className="text-color-secondary text-lg">
                {isOwnProfile ? 'Your profile information' : `${profileUser.firstName}'s profile`}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <ProfileActions 
                profileUserId={profileUser.id}
                profileUserName={`${profileUser.firstName} ${profileUser.lastName}`}
                canEdit={isOwnProfile || false}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                <img
                  src={profileUser.profilePictureUrl || '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-color-primary">
                {profileUser.firstName} {profileUser.lastName}
              </h2>
              <p className="text-color-secondary mt-1">{profileUser.email}</p>
              <div className="flex mt-2 items-center space-x-2">
                <span className={`px-3 py-1 text-sm rounded-full flex items-center ${
                  profileUser.role.toLowerCase() === 'instructor' 
                    ? 'bg-blue-100 text-blue-800'
                    : profileUser.role.toLowerCase() === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {profileUser.role.toLowerCase() === 'instructor' && (
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  )}
                  {profileUser.role.toLowerCase() === 'admin' && (
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {profileUser.role.toLowerCase() === 'student' && (
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  <span>{profileUser.role}</span>
                </span>
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-primary pt-8">
              <div className="space-y-8">
                {/* Special instructor section */}
                {profileUser.role.toLowerCase() === 'instructor' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-color-primary mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-color-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      Instructor
                    </h3>
                    <p className="text-color-secondary">
                      {profileUser.firstName} is an instructor on our platform. Instructors create and teach courses, providing valuable knowledge and resources to our students.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-color-primary mb-2">Bio</h3>
                  <p className="text-color-secondary whitespace-pre-wrap">
                    {profileUser.bio || 'No bio provided'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-color-primary mb-2">Account Details</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-color-secondary">First Name</dt>
                      <dd className="mt-1 text-color-primary">{profileUser.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-color-secondary">Last Name</dt>
                      <dd className="mt-1 text-color-primary">{profileUser.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-color-secondary">Email</dt>
                      <dd className="mt-1 text-color-primary">{profileUser.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-color-secondary">Role</dt>
                      <dd className="mt-1 text-color-primary capitalize">{profileUser.role}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* User's enrolled courses section */}
        <div className="mt-8">
          <UserCourses 
            userId={numericUserId} 
            isOwnProfile={isOwnProfile || false} 
          />
        </div>
        
        {/* Debug tester - only visible for your own profile */}
        {isOwnProfile && (
          <div className="mt-8">
            <MyCoursesTester />
          </div>
        )}
      </div>
      
      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-color-primary">
                Report User
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-color-secondary hover:text-color-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
              <div className="flex">
                <svg className="w-5 h-5 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm">
                  You are reporting <span className="font-semibold">{profileUser.firstName} {profileUser.lastName}</span>. Please provide a valid reason and details. False reports may result in account restrictions.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-color-secondary mb-1">
                Reason *
              </label>
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Enter reason for reporting"
                className="w-full px-3 py-2 border border-primary rounded-md bg-input text-color-primary focus:ring-2 focus:ring-accent focus:border-accent"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-color-secondary mb-1">
                Details *
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide details about why you are reporting this user"
                rows={4}
                className="w-full px-3 py-2 border border-primary rounded-md bg-input text-color-primary focus:ring-2 focus:ring-accent focus:border-accent"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-primary rounded-md text-color-primary bg-secondary hover:bg-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportReason.trim() || !reportDetails.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSubmittingReport ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 