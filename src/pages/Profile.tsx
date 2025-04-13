import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserAPI } from '../api/axios';
import ProfileActions from '../components/user/ProfileActions';

interface ProfileProps {
  userId?: string; // Optional prop to view another user's profile
}

const Profile: React.FC<ProfileProps> = ({ userId: propUserId }) => {
  const { user: currentUser, isLoading } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState(currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which user ID to use
  const userId = propUserId || paramUserId || (currentUser ? currentUser.id : null);
  const isOwnProfile = currentUser && userId === currentUser.id;

  useEffect(() => {
    // If viewing own profile, use currentUser data
    if (isOwnProfile && currentUser) {
      setProfileUser(currentUser);
      return;
    }
    
    // If viewing another user's profile, fetch their data
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId, currentUser, isOwnProfile]);

  const fetchUserProfile = async (id: string | number) => {
    try {
      setLoading(true);
      // This would need to be implemented in your API
      // For now, we'll just use the currentUser as a fallback
      if (currentUser) {
        setProfileUser(currentUser);
      } else {
        setError('User profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
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
            
            <ProfileActions 
              profileUserId={profileUser.id}
              profileUserName={`${profileUser.firstName} ${profileUser.lastName}`}
              canEdit={isOwnProfile || false}
            />
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
              <span className="mt-2 px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 capitalize">
                {profileUser.role}
              </span>
            </div>

            <div className="border-t border-primary pt-8">
              <div className="space-y-8">
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
      </div>
    </div>
  );
};

export default Profile; 