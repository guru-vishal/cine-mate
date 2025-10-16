import React, { useState } from 'react';
import { User, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserStats from '../components/UserStats';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      const updateData = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center py-20">
          <User className="h-24 w-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-400 mb-4">Access Denied</h2>
          <p className="text-gray-500">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-8">
          {/* Profile Info */}
          <div>
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Account Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-300"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password Change */}
                {isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                          placeholder="Enter current password to change it"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </>
                )}

                {isEditing && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white py-3 rounded-lg transition-colors duration-300"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Updating...' : 'Save Changes'}</span>
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Stats */}
          <div>
            <UserStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;