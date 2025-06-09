"use client"
import { useState } from 'react';

import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useUserStore } from '@/store/useUserStore';
import Modal from '../shared/modal'
import { useNotificationStore } from '@/store/useNotificationStore';


const LogoutModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useUserStore((state) => state.user);
    const clearUser = useUserStore((state) => state.clearUser)
    const showNotification = useNotificationStore((state) => state.showNotification);

    // Function to open modal
    const openModal = () => setIsModalOpen(true);

    // Function to close modal
    const closeModal = () => setIsModalOpen(false);

    // Handle logout logic
    const handleLogout = async () => {
        const username = user.username;
        clearUser();
        closeModal();  // Close modal after logout
        window.location.href = '/login';
    };

    return (
        <div>
        <button 
            className="block flex items-center p-2 my-4 rounded hover:text-red-800 cursor-pointer"
            onClick={openModal}  
        >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-2 text-red-700" aria-hidden="true" />
            Logout
        </button>

        {/* Logout confirmation modal */}
        <Modal isOpen={isModalOpen} onClose={closeModal} style="p-9">
            <h2 className="text-lg mb-4 text-black p-3">
                {user.username 
                    ? `Goodbye ${user.username}, are you sure you want to log out?`
                    : 'Are you sure you want to log out?'
                }
            </h2>
            <div className="flex justify-between space-x-4">
            <button onClick={closeModal} className="px-4 py-2 text-white bg-cyan-600 rounded-md cursor-pointer">
                Cancel
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer">
                Confirm Logout
            </button>
            </div>
        </Modal>
        </div>
    );
};

export default LogoutModal;
