'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getInitials } from '@/lib/utility';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { updatePassword, updateUser } from '@/services/userService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye , faEyeSlash } from "@fortawesome/free-solid-svg-icons";
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
    <Navbar/>
    <Sidebar />
    <main className = "ml-32 bg-white min-h-screen p-10">
        <div className="py-40 p-50 text-black">
            {/* User Block */}
                <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gray-300 text-black rounded-full h-14 w-14 flex items-center justify-center font-bold">
                        {userInitials || '??'}
                        </div>
                    <div>
                    <h1 className="text-2xl font-semibold">{user.username}</h1>
                </div>
            </div>


            <h2 className="text-xl font-semibold mb-4">Change Username</h2>
            <div className="flex items-center space-x-4 mb-8">
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="New username"
                    className="w-full sm:w-1/2 lg:w-1/4 border border-gray-300 p-3 rounded-lg"
                />
                <button
                    onClick={handleSaveChanges}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg">
                    Save
                </button>
            </div>
            {/* Password Block */}
            {/* Change Password */}
          {/* Change Password */}
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>

        {/* Current Password */}
        <div className="mb-4">
        <div className="relative w-full sm:w-1/2 lg:w-1/4">
            <input
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            placeholder="Current password"
            className="w-full border border-gray-300 p-3 pr-10 rounded-lg"
            />
            <button
            type="button"
            onClick={() => setShowOld(o => !o)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
            >
            <FontAwesomeIcon icon={showOld ? faEye : faEyeSlash} />
            </button>
        </div>
        </div>

        {/* New Password */}
        <div className="mb-4">
        <div className="relative w-full sm:w-1/2 lg:w-1/4">
            <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-gray-300 p-3 pr-10 rounded-lg"
            />
            <button
            type="button"
            onClick={() => setShowNew(n => !n)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
            >
            <FontAwesomeIcon icon={showNew ? faEye : faEyeSlash} />
            </button>
        </div>
        </div>

        {/* Confirm + Save */}
        <div className="flex items-center space-x-4 mb-8">
        <div className="w-full sm:w-1/2 lg:w-1/4">
            <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-gray-300 p-3 rounded-lg"
            />
        </div>
        <button
            onClick={handlePasswordSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg"
        >
            Save
        </button>
        </div>

        <div className="mt-8">
          {user.school !== 'PLAYGROUND' && 
          (        <button
            onClick={() => setDeleteModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg cursor-pointer"
          >
            Delete Account
          </button>)}
        </div>

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
