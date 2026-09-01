'use client'

// The dashboard's card chrome, extracted so the surfaces that make up a page
// share one border/radius/shadow instead of each restating it.

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  /** Removes the inner padding when a child needs to bleed to the edges. */
  flush?: boolean
}

const Card: React.FC<CardProps> = ({ children, className = '', flush = false }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
      flush ? '' : 'p-5 lg:p-6'
    } ${className}`}
  >
    {children}
  </div>
)

export default Card
