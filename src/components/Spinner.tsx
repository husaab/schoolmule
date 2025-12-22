import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="relative">
        {/* Outer glow */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 blur-md opacity-30 animate-pulse`} />
        {/* Main spinner */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full animate-spin`}
          style={{
            background: 'conic-gradient(from 0deg, transparent, #0891b2)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))'
          }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-gradient-to-br from-cyan-500 to-teal-500`} />
        </div>
      </div>
    </div>
  )
}

export default Spinner
