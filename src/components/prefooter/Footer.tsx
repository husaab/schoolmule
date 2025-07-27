// File: src/components/footer/Footer.tsx
'use client'

import { FC } from 'react'
import Link from 'next/link'
import { 
  FontAwesomeIcon 
} from '@fortawesome/react-fontawesome'
import {
  faInstagram,
  faXTwitter,
  faFacebook,
  faLinkedin
} from '@fortawesome/free-brands-svg-icons'
import {
  faEnvelope,
  faCopyright
} from '@fortawesome/free-solid-svg-icons'

const Footer: FC = () => {
  const year = new Date().getFullYear()
  const supportEmail = 'schoolmule.official@gmail.com'
  const subject = 'Technical Support Request'
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`

  return (
    <footer className="hidden md:block fixed bottom-0 w-full bg-white text-gray-700 border-t border-gray-300 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-4">
        {/* Copyright */}
        <div className="flex items-center mb-4 md:mb-0">
          <FontAwesomeIcon icon={faCopyright} className="h-4 w-4 mr-1" />
          <span>{year} SchoolMule — All rights reserved</span>
        </div>

        {/* Contact */}
        <div className="flex items-center mb-4 md:mb-0">
          <a href={mailto} className="flex items-center hover:underline">
            <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 mr-1" />
            {supportEmail}
          </a>
        </div>

        {/* Social Icons */}
        <div className="flex space-x-4">
          <a href="https://twitter.com/yourhandle" aria-label="Twitter" target="_blank" className="hover:text-blue-500">
            <FontAwesomeIcon icon={faXTwitter} className="h-5 w-5" />
          </a>
          <a href="https://facebook.com/yourpage" aria-label="Facebook" target="_blank" className="hover:text-blue-700">
            <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
          </a>
          <a href="https://linkedin.com/in/yourprofile" aria-label="LinkedIn" target="_blank" className="hover:text-blue-600">
            <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
          </a>
          <a href="https://instagram.com/yourhandle" aria-label="Instagram" target="_blank" className="hover:text-pink-600">
            <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
