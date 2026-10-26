'use client'

import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

// How to delete a SchoolMule account, for anyone, signed in or not. Google
// Play links its listing here (account deletion policy); the app's
// /delete-account screen carries the same words.
export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your SchoolMule account" updated="Last updated 26 October 2026">
      <p>
        You can delete your SchoolMule account yourself, in the app or on the website, or ask us
        to delete it for you.
      </p>

      <h2>Delete it yourself</h2>
      <ul>
        <li>In the SchoolMule app: open the menu, go to <strong>Settings</strong>, and tap <strong>Delete Account</strong> at the bottom.</li>
        <li>On the website: sign in at <a href="https://schoolmule.ca/login">schoolmule.ca</a>, open <strong>Settings</strong>, and choose <strong>Delete Account</strong>.</li>
        <li>Students: tap <strong>Delete my account</strong> at the bottom of your home page in the app, or <strong>Delete account</strong> at the top of any page on the website.</li>
      </ul>
      <p>
        You confirm by typing your username. The account is deleted straight away and you are
        signed out on every device.
      </p>

      <h2>Ask us to delete it</h2>
      <p>
        If you can&apos;t sign in, email{' '}
        <a href="mailto:info@schoolmule.ca?subject=Delete%20my%20SchoolMule%20account">info@schoolmule.ca</a>{' '}
        from the address on your account with the subject &ldquo;Delete my SchoolMule account&rdquo;.
        Tell us your school. We confirm the request with you and delete the account within 30 days.
        You can also ask your school&apos;s office.
      </p>

      <h2>What is deleted</h2>
      <ul>
        <li>Your sign-in: your email address, password, and any Google or Apple sign-in linked to it.</li>
        <li>Your profile: your name, photo and avatar.</li>
        <li>Your phones&apos; notification registrations, your notification and email settings, and the student views you saved.</li>
        <li>For a parent, the link between your account and your children&apos;s records. For a student, the link between your sign-in and your school record, so your school can invite you again.</li>
      </ul>

      <h2>What your school keeps</h2>
      <p>
        Your school owns the school records it keeps in SchoolMule, and they are not part of your
        account: a student&apos;s grades, attendance and report cards, and the school&apos;s
        conversation history. Messages you sent stay in those conversations, shown as from a
        deleted user. To have school records deleted, ask your school; it decides under its own
        records policy and the law, and we help it carry that out.
      </p>

      <h2>Questions</h2>
      <p>
        Email <a href="mailto:info@schoolmule.ca">info@schoolmule.ca</a>, or read our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  )
}
