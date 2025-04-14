import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserAPI } from '../api/axios';

const ProfileEdit: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || ''
      });
      
      if (user.profilePictureUrl) {
        setPreviewUrl(user.profilePictureUrl);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    setImageError(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setMessage({
          type: 'error',
          text: 'Please select a valid image file (JPG, PNG, or GIF)'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setMessage({
          type: 'error',
          text: 'Image size should be less than 5MB'
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        // Clear any previous error messages
        setImageError(false);
        setMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setIsLoading(true);
    setMessage(null);
    setImageError(false);
    
    // Show a loading message
    setMessage({ type: 'success', text: 'Saving profile changes...' });

    try {
      // If a new image is selected, upload it first
      if (selectedImage) {
        try {
          console.log('Uploading profile picture:', selectedImage.name);
          
          // Create FormData for the image upload
          const formData = new FormData();
          formData.append('picture', selectedImage, selectedImage.name);
          
          // Get the token for authentication
          const token = localStorage.getItem('token');
          
          // Upload the image using fetch
          const response = await fetch('https://localhost:7104/api/Users/profile/picture', {
            method: 'PUT',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData
          });
          
          // Parse response
          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error('Invalid server response');
          }
          
          if (response.ok && data.isSuccess) {
            console.log('Profile picture uploaded successfully');
            
            // Get the fresh user data after picture upload
            const profileResponse = await fetch('https://localhost:7104/api/Users/profile', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            const profileData = await profileResponse.json();
            
            if (profileData.isSuccess && profileData.data) {
              // Update image preview with the latest URL
              if (profileData.data.profilePictureUrl) {
                setPreviewUrl(profileData.data.profilePictureUrl);
              }
              
              // Update user context with fresh data
              updateUser(profileData.data);
              localStorage.setItem('userData', JSON.stringify(profileData.data));
            }
            
          } else {
            throw new Error(data.message || 'Failed to upload profile picture');
          }
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Failed to upload profile picture'
          });
          // Wait a moment to let the user see the error
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }

      // Create profile data object
      const profileUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        bio: formData.bio
      };
      
      // Update the profile with the data
      const updateResponse = await UserAPI.updateProfile(profileUpdateData);
      
      if (updateResponse.isSuccess) {
        // After successful update, get the fresh user data
        try {
          // Get fresh user data directly
          const response = await fetch('https://localhost:7104/api/Users/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          const profileData = await response.json();
          
          if (profileData.isSuccess && profileData.data) {
            // Update user context with the fresh data
            updateUser(profileData.data);
            
            // Update localStorage directly
            localStorage.setItem('userData', JSON.stringify(profileData.data));
            
            // Show success and navigate
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => navigate('/profile'), 1500);
          } else {
            throw new Error('Failed to refresh profile data');
          }
        } catch (error) {
          console.error('Error refreshing profile:', error);
          setMessage({ type: 'error', text: 'Profile updated but failed to refresh data' });
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: updateResponse.message || 'Failed to update profile' 
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: 'An error occurred while updating your profile' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="bg-blue-500 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
              <p className="text-white text-lg">Update your personal information</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-primary">
          {message && (
            <div className={`p-4 ${
              message.type === 'success' ? 'bg-success bg-opacity-10' : 'bg-error bg-opacity-10'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${message.type === 'success' ? 'text-success' : 'text-error'}`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="flex items-center justify-center mb-8">
              <div className="relative group">
                <div 
                  className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer"
                  onClick={handleImageClick}
                >
                  <img
                    src={imageError 
                      ? 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3e%3crect fill="%234285f4" width="150" height="150"/%3e%3ctext fill="%23fff" font-family="Arial" font-size="60" font-weight="bold" text-anchor="middle" x="75" y="95"%3eU%3c/text%3e%3c/svg%3e' 
                      : (previewUrl || user?.profilePictureUrl || 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3e%3crect fill="%234285f4" width="150" height="150"/%3e%3ctext fill="%23fff" font-family="Arial" font-size="60" font-weight="bold" text-anchor="middle" x="75" y="95"%3eU%3c/text%3e%3c/svg%3e')}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const imgUrl = (e.target as HTMLImageElement).src;
                      console.error('Failed to load profile image:', imgUrl);
                      setImageError(true);
                      // Set src to an inline SVG data URI (can't be blocked)
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3e%3crect fill="%234285f4" width="150" height="150"/%3e%3ctext fill="%23fff" font-family="Arial" font-size="60" font-weight="bold" text-anchor="middle" x="75" y="95"%3eU%3c/text%3e%3c/svg%3e';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white text-sm font-medium">Upload Photo</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {selectedImage && (
                  <div className="mt-2 text-center">
                    <div className="text-sm text-blue-500 mb-2">
                      {selectedImage.name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-color-secondary mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-primary bg-card text-color-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-color-secondary mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-primary bg-card text-color-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-color-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-primary bg-card text-color-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-color-secondary mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-primary bg-card text-color-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                placeholder="Tell us about yourself..."
              />
              <p className="mt-2 text-sm text-color-secondary">
                Brief description for your profile.
              </p>
            </div>

            <div className="flex justify-end pt-6 border-t border-primary space-x-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-3 bg-secondary text-color-primary rounded-lg font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 bg-blue-500 text-white rounded-lg font-medium shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit; 