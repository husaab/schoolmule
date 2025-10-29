'use client'

import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';

const Notification: React.FC = () => {
  const { message, type, isOpen, closeNotification } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeNotification();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, closeNotification]);

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg z-100 text-white flex items-center space-x-2 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`}
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
    >
      {type === 'success' ? (
        <CheckCircleIcon className="w-6 h-6 text-white cursor-pointer" />
      ) : (
        <XCircleIcon className="w-6 h-6 text-white cursor-pointer" />
      )}
      <span>{message}</span>
      <button onClick={closeNotification} className="ml-4 text-lg">&times;</button>
    </motion.div>
  );
};

export default Notification;
