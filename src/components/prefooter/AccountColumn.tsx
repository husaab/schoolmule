'use client'
import { FC } from 'react'
import { useSignedInHome } from '@/components/marketing/useSignedInHome'
import FooterColumn from './FooterColumn'

// Log in and Sign up, or the way back to the app for a signed-in visitor.
const AccountColumn: FC = () => {
  const home = useSignedInHome()
  return (
    <FooterColumn
      title="Already a SchoolMule school"
      links={
        home
          ? [{ href: home.href, label: home.label }]
          : [
              { href: '/login', label: 'Log in' },
              { href: '/signup', label: 'Sign up' },
            ]
      }
    />
  )
}

export default AccountColumn
