'use client'

import LegalPage from '@/components/legal/LegalPage'

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="Last updated 2 September 2026">
      <p>
        These terms govern use of SchoolMule. By creating an account or using the service,
        the school and its users agree to them.
      </p>

      <h2>The service</h2>
      <p>
        SchoolMule provides school administration software, including student records,
        attendance, gradebooks, report cards, scheduling and registration forms. Features
        available to a given school depend on its plan and configuration.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>Accounts are issued to a school and to named staff within it. Credentials must not be shared.</li>
        <li>The school is responsible for activity under its accounts, and for removing access when a staff member leaves.</li>
        <li>Tell us promptly at <a href="mailto:info@schoolmule.ca">info@schoolmule.ca</a> if you believe an account has been compromised.</li>
      </ul>

      <h2>School data</h2>
      <p>
        Data a school enters remains the school&apos;s property. We process it to provide the
        service, on the school&apos;s instructions, as described in our{' '}
        <a href="/privacy">Privacy Policy</a>. We do not sell it, and we do not use it to
        train models or for advertising.
      </p>
      <p>
        The school is responsible for having the authority to enter the information it
        provides, including student and guardian information, and for meeting the
        obligations that apply to it under applicable privacy law.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service unlawfully, or to store unlawful content.</li>
        <li>Attempt to access another school&apos;s data, or any account or system you are not authorised to use.</li>
        <li>Probe, scan or interfere with the service&apos;s security or availability, or attempt to circumvent limits.</li>
        <li>Copy, resell or redistribute the service, or reverse engineer it, except where the law expressly permits.</li>
        <li>Upload malware or use the service to send unsolicited bulk email.</li>
      </ul>

      <h2>Third-party integrations</h2>
      <p>
        Optional integrations, such as connecting a Google account to keep a spreadsheet
        up to date, are provided for convenience. Your use of the third-party service
        remains governed by that provider&apos;s own terms, and we are not responsible for
        their availability or behaviour. You may disconnect an integration at any time.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep the service available and to protect your data, including regular
        backups. We may perform maintenance, and we may change or discontinue features. We
        will give reasonable notice of a change that materially reduces functionality a
        school depends on.
      </p>

      <h2>Fees</h2>
      <p>
        Where a school subscribes to a paid plan, fees and billing period are those agreed
        at sign-up. Fees are payable in advance and are non-refundable except where
        required by law or expressly agreed.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        A school may stop using the service at any time and request export or deletion of
        its data. We may suspend or terminate access for a material breach of these terms
        or for non-payment, and will give notice and an opportunity to resolve the issue
        where it is reasonable to do so.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the fullest extent permitted by
        law, we disclaim implied warranties, including merchantability and fitness for a
        particular purpose. Nothing in these terms limits liability that cannot be limited
        by law.
      </p>
      <p>
        To the fullest extent permitted by law, our aggregate liability arising out of or
        relating to the service is limited to the amount the school paid us in the twelve
        months before the event giving rise to the claim, and we are not liable for
        indirect or consequential loss.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Province of Ontario and the federal
        laws of Canada applicable there, and the courts of Ontario have jurisdiction.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Material changes will be announced in the application
        and reflected in the date above. Continued use after a change means acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:info@schoolmule.ca">info@schoolmule.ca</a>.
      </p>
    </LegalPage>
  )
}
