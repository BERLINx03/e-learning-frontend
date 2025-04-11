import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Profile</h1>
              <p className="text-gray-300 text-lg">View your profile information</p>
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                <img
                  src={user.profilePictureUrl || '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 mt-1">{user.email}</p>
              <span className="mt-2 px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 capitalize">
                {user.role}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {user.bio || 'No bio provided'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Details</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">First Name</dt>
                      <dd className="mt-1 text-gray-900">{user.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                      <dd className="mt-1 text-gray-900">{user.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="mt-1 text-gray-900 capitalize">{user.role}</dd>
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