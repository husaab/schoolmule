'use client'

import LegalPage from '@/components/legal/LegalPage'

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated 2 September 2026">
      <p>
        SchoolMule is school administration software used by schools to manage student
        records, attendance, grades, report cards and registration forms. This policy
        explains what we collect, why, and what we do with it.
      </p>
      <p>
        Schools are the owners of the data they put into SchoolMule. We process it on
        their behalf and at their direction.
      </p>

      <h2>Information we collect</h2>

      <h3>Information schools provide</h3>
      <ul>
        <li><strong>Student records</strong> — name, grade, date of birth, student identifiers, address, medical or allergy notes, and emergency contacts.</li>
        <li><strong>Guardian details</strong> — names, email addresses and phone numbers.</li>
        <li><strong>Academic records</strong> — assessments, grades, attendance, report card comments and progress reports.</li>
        <li><strong>Staff accounts</strong> — name, email address, role and an encrypted password.</li>
        <li><strong>Form submissions</strong> — the answers families give on registration and other forms a school publishes.</li>
      </ul>

      <h3>Information we collect automatically</h3>
      <ul>
        <li>Basic technical logs needed to operate and secure the service, including IP address and timestamps.</li>
        <li>The IP address attached to a public form submission, retained to prevent spam and abuse.</li>
      </ul>

      <p>
        We do not use advertising trackers, and we do not build advertising profiles from
        anything in SchoolMule.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To provide the features a school has chosen to use.</li>
        <li>To send email a school initiates, such as report cards or account verification.</li>
        <li>To secure the service, investigate abuse and diagnose faults.</li>
        <li>To meet legal obligations.</li>
      </ul>
      <p>
        <strong>We do not sell personal information, and we never share one school&apos;s data
        with another.</strong> Each school&apos;s records are isolated, and staff accounts can
        only reach the school they belong to.
      </p>

      <h2>Google user data</h2>
      <p>
        SchoolMule offers an optional integration that keeps a school&apos;s Google Sheet up to
        date with the submissions received on one of its forms. This section describes
        exactly what that integration does, because it involves your Google account.
      </p>

      <h3>What we request</h3>
      <p>
        When a school connects Google, we request a single permission:{' '}
        <strong>
          <code>drive.file</code>
        </strong>{' '}
        — described by Google as access to &ldquo;only the specific Google Drive files you
        use with this app&rdquo;.
      </p>

      <h3>What that permission does and does not allow</h3>
      <ul>
        <li>We can write to a spreadsheet <strong>only</strong> if you explicitly select it through Google&apos;s own file picker, or if SchoolMule created it for you.</li>
        <li>We <strong>cannot</strong> see, open, or list any other file in your Google Drive. The permission does not grant access to your Drive as a whole.</li>
        <li>We do not read your email, contacts, calendar or any other Google service.</li>
      </ul>

      <h3>What we do with it</h3>
      <ul>
        <li>We write form submission data — submission date, status, and the answers given — into the sheet you selected.</li>
        <li>We write only to the columns SchoolMule owns. Columns you add alongside ours are never read or modified.</li>
        <li>We read back only our own identifier column, in order to update the correct row.</li>
      </ul>

      <h3>Storage and revocation</h3>
      <p>
        We store an encrypted Google refresh token so the sheet can stay current without
        you signing in again. It is encrypted at rest, never written to logs, and never
        returned by our API.
      </p>
      <p>
        You can disconnect at any time from within SchoolMule, or revoke access directly at{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
          your Google account permissions page
        </a>
        . Disconnecting stops all future writes; the spreadsheet itself and everything
        already in it remain yours and are left untouched.
      </p>
      <p>
        SchoolMule&apos;s use of information received from Google APIs adheres to the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. We do not transfer Google user data to
        third parties, do not use it for advertising, and do not allow humans to read it
        except where required for security, to comply with the law, or with your explicit
        permission.
      </p>

      <h2>Service providers</h2>
      <p>
        We rely on a small number of providers to run the service, each with access only
        to what their function requires:
      </p>
      <ul>
        <li><strong>Supabase</strong> — database and file storage.</li>
        <li><strong>Railway</strong> — application hosting.</li>
        <li><strong>Resend</strong> — transactional email.</li>
        <li><strong>Google</strong> — only where a school has connected the optional Sheets integration described above.</li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep school data for as long as the school maintains an account with us. On
        request, or after an account closes, we delete or return it within a reasonable
        period, except where we are required to retain something by law.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed and never stored in readable form. Access tokens are
        encrypted at rest. Access is scoped so a staff account can only reach its own
        school&apos;s records. No system is perfectly secure, but we take these obligations
        seriously and design for isolation by default.
      </p>

      <h2>Children&apos;s information</h2>
      <p>
        SchoolMule holds information about students, supplied by their school. We are not
        directed at children and do not knowingly collect information directly from them.
        Requests concerning a student&apos;s information should go to the school, which is the
        owner of that record; we assist schools in responding.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, or delete
        personal information we hold, or to object to how it is processed. Because schools
        control their own data, please contact your school first. You can also reach us
        and we will help.
      </p>

      <h2>Changes</h2>
      <p>
        If we make a material change to this policy we will update the date at the top and
        notify schools through the application.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your information:{' '}
        <a href="mailto:info@schoolmule.ca">info@schoolmule.ca</a>.
      </p>
    </LegalPage>
  )
}
