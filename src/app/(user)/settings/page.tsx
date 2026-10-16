'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import Avatar from '@/components/avatar/Avatar';
import AvatarPickerModal from '@/components/avatar/AvatarPickerModal';
import Modal from '@/components/shared/modal';
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit';
import { cropProfilePhoto } from '@/lib/imageCrop';
import { deletePhoto, getProfile, saveAvatar, uploadPhoto } from '@/services/profileService';
import type { AvatarSpec } from '@/services/types/profile';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { updatePassword, updateUser } from '@/services/userService';
import { EyeIcon, EyeSlashIcon, UserCircleIcon, KeyIcon, TrashIcon, CheckIcon, FaceSmileIcon, PhotoIcon } from '@heroicons/react/24/outline';
import DeleteUserModal from '@/components/user/delete/DeleteUserModal';
import { roleLabel } from '@/components/adminUsers/userDisplay';

// Writes the avatar or photo into the signed-in user, so the sidebar, navbar
// and every other avatar of theirs update at once.
const patchUser = (fields: { avatar?: AvatarSpec | null; photoUrl?: string | null }) => {
  const store = useUserStore.getState();
  store.setUser({ ...store.user, ...fields });
};

const Settings = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const showNotification = useNotificationStore((state) => state.showNotification);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Avatar and photo. Settings is for staff and parents (students stay in
  // the student portal), so photos are always allowed here; the server
  // still decides.
  const displayName = user.fullName || user.username || 'You';
  const [photosAllowed, setPhotosAllowed] = useState(user.role !== 'STUDENT');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [removePhotoOpen, setRemovePhotoOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  // A fresh signed photo URL (they expire) and the photo permission.
  useEffect(() => {
    if (!user.id) return;
    let live = true;
    getProfile()
      .then((res) => {
        if (!live) return;
        setPhotosAllowed(res.data.photosAllowed);
        patchUser({ avatar: res.data.avatar, photoUrl: res.data.photoUrl });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user.id]);

  const handleAvatarSave = async (avatar: AvatarSpec) => {
    const res = await saveAvatar(avatar);
    patchUser({ avatar: res.data.avatar });
    showNotification('Avatar saved', 'success');
  };

  const handlePhotoPicked = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const photo = await cropProfilePhoto(file);
      const res = await uploadPhoto(photo);
      patchUser({ photoUrl: res.data.photoUrl });
      showNotification('Photo saved', 'success');
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "Your photo couldn't be saved", 'error');
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoBusy(true);
    try {
      await deletePhoto();
      patchUser({ photoUrl: null });
      setRemovePhotoOpen(false);
      showNotification('Photo removed. Your avatar shows instead.', 'success');
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "Your photo couldn't be removed", 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

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
        // The database role, never the active view: a teacher in parent view
        // must not post PARENT back for a TEACHER row.
        role:     (user.baseRole ?? user.role)!
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
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <Avatar name={displayName} avatar={user.avatar} photoUrl={user.photoUrl} size={64} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-900">{user.username}</h2>
                <p className="text-slate-500 text-sm truncate">{user.email}</p>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">
                  {roleLabel(user.baseRole ?? user.role ?? '')}
                </span>
                {(user.roles?.length ?? 0) > 1 && (
                  <span className="inline-flex items-center mt-1 ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    Also a parent
                  </span>
                )}
              </div>
              <div className="flex w-full flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <FaceSmileIcon className="h-4 w-4 text-slate-400" />
                  Change avatar
                </button>
                {photosAllowed && (
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    disabled={photoBusy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {photoBusy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden />
                    ) : (
                      <PhotoIcon className="h-4 w-4 text-slate-400" />
                    )}
                    {user.photoUrl ? 'Change photo' : 'Upload a photo'}
                  </button>
                )}
                {user.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setRemovePhotoOpen(true)}
                    disabled={photoBusy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove photo
                  </button>
                )}
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoPicked(e.target.files?.[0])}
                />
              </div>
              {user.photoUrl && (
                <p className="w-full text-xs text-slate-500">
                  Your photo shows instead of your avatar. Remove it to go back to the avatar.
                </p>
              )}
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

      <AvatarPickerModal
        isOpen={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        title="Your avatar"
        subtitle={
          user.photoUrl
            ? 'Your photo shows for now; this avatar shows if you remove it.'
            : 'Shown next to your name everywhere in SchoolMule.'
        }
        name={displayName}
        value={user.avatar ?? null}
        onSave={handleAvatarSave}
        photosAllowed={photosAllowed}
        onUsePhoto={() => photoInput.current?.click()}
      />

      <Modal isOpen={removePhotoOpen} onClose={() => !photoBusy && setRemovePhotoOpen(false)}>
        <ModalHeader title="Remove your photo?" tone="danger" icon={TrashIcon} />
        <ModalBody>
          <ConfirmBody>Your avatar shows instead, everywhere your photo appears. You can upload a photo again any time.</ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRemovePhotoOpen(false)} disabled={photoBusy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handlePhotoRemove} loading={photoBusy}>
            Remove photo
          </Button>
        </ModalFooter>
      </Modal>

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
