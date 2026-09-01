'use client'

// An empty screen is an invitation to act, so this always takes a message
// that says what will fill it — and optionally the action that does.

import React from 'react'

interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`text-center py-10 ${className}`}>
    <Icon className="h-9 w-9 mx-auto mb-3 text-slate-300" />
    <p className="text-sm font-medium text-slate-700">{title}</p>
    {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState
