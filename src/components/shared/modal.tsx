// components/Modal.js
'use client'
import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; 
import { createPortal } from 'react-dom';

interface ModalProps {
    style?: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  
const Modal = ({ isOpen, onClose, children, style }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling when modal is open
    } else {
      document.body.style.overflow = 'auto';   // Restore scrolling when modal is closed
    }

    return () => {
      document.body.style.overflow = 'auto';   // Clean up on unmount
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black opacity-10"
        onClick={onClose}
      ></div>

      {/* Modal box */}
      <div className={`relative bg-white rounded-lg shadow-lg z-10 overflow-y-auto max-h-[70vh] ${style}`}>  
        <button
          className="absolute top-2 right-2 text-lg"
          onClick={onClose}
        >
          <XMarkIcon className="w-8 text-black cursor-pointer" />
        </button>
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
