import React from 'react'

/**
 * A simple spinner component using Tailwind CSS for loading states.
 */
const Spinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default Spinner
