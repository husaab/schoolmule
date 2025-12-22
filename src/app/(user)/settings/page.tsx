'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getInitials } from '@/lib/utility';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { updatePassword, updateUser } from '@/services/userService';
import { EyeIcon, EyeSlashIcon, UserCircleIcon, KeyIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import DeleteUserModal from '@/components/user/delete/DeleteUserModal';

const Settings = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const showNotification = useNotificationStore((state) => state.showNotification);
  const userInitials = getInitials(user.username);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [username, setUsername] = useState(user.username || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordSave = async () => {
      if (
        oldPassword.trim() === '' ||
        newPassword.trim() === '' ||
        confirmPassword.trim() === ''
      ) {
        showNotification('Password fields cannot be empty', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
      }
      if (user.id) {
        try {
          await updatePassword(String(user.id), {
            oldPassword,
            newPassword,
          });
          showNotification('Password update successful!', 'success');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch {
          showNotification('Failed to update password: Incorrect current password', 'error');
        }
      } else {
        console.error('User id not found!');
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    };

    const handleSaveChanges = async () => {
    try {
      await updateUser(String(user.id), {
        email:    user.email!,      // ← send the current one back
        username: username,        // ← the new one the user typed
        school:   user.school!,     // ← send the current one back
        role:     user.role!        // ← send the current one back
        
      });

      setUser({
        ...user,
        username
      });

      showNotification('Profile updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update user:', err);
      showNotification('Failed to update profile', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account preferences and security</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                {userInitials || '??'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{user.username}</h2>
                <p className="text-slate-500 text-sm">{user.email}</p>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Change Username */}
            <div className="flex items-center gap-3 mb-4">
              <UserCircleIcon className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">Change Username</h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="New username"
                className="flex-1 max-w-md border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50"
              />
              <button
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium cursor-pointer"
              >
                <CheckIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          {/* Password Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <KeyIcon className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
            </div>

            <div className="space-y-4 max-w-md">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(o => !o)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOld ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(n => !n)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50"
                />
              </div>

              <button
                onClick={handlePasswordSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium cursor-pointer mt-2"
              >
                <CheckIcon className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          {user.school !== 'PLAYGROUND' && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrashIcon className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-slate-900">Danger Zone</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium cursor-pointer"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          )}
        </div>
      </main>

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={() => {
          // optional: show a final toast, redirect, etc.
        }}
      />
    </>
  );
};

export default Settings;
