import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'
import { pageMetadata } from '@/lib/marketing/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'What SchoolMule collects, why, who processes it, and how schools and families can reach us about their information.',
  path: '/privacy',
})

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated 26 October 2026">
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
        <li><strong>Accounts</strong> — for staff, families and, where a school turns on the student portal, students: name, email address, role and a password stored only as a hash.</li>
        <li><strong>Classwork</strong> — where a school uses the student portal: work students turn in, quiz answers, and messages between students and teachers.</li>
        <li><strong>Form submissions</strong> — the answers families give on registration and other forms a school publishes.</li>
      </ul>

      <h3>Information we collect automatically</h3>
      <ul>
        <li>Basic technical logs needed to operate and secure the service, including IP address and timestamps.</li>
        <li>The IP address attached to a public form submission, retained to prevent spam and abuse.</li>
        <li>Page views on our website and in the application, counted with Vercel Web Analytics, which does not use cookies.</li>
        <li>If you allow notifications in the SchoolMule app, the push token your phone issues for the app, and which kinds of notification you have switched on, so we can send them. Signing out removes it.</li>
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
        SchoolMule uses Google in two optional ways: signing in with your Google account, and
        an integration that keeps a school&apos;s Google Sheet up to date with the submissions
        received on one of its forms. This section describes exactly what each one does,
        because both involve your Google account.
      </p>

      <h3>Signing in with Google</h3>
      <p>
        You can sign in to SchoolMule, or create an account, with your Google account instead
        of a password. For this we ask Google only for your basic profile: your name, your email
        address and Google&apos;s identifier for your account. We do not request access to your
        Gmail, Drive, contacts, calendar or any other Google data.
      </p>
      <ul>
        <li>We use your email address to find your SchoolMule account, or to create one when you sign up, and to match a parent account to their children&apos;s school records.</li>
        <li>We keep Google&apos;s account identifier so that your Google account keeps opening the same SchoolMule account. We store no Google password or access token for sign-in.</li>
        <li>When you sign up with Google, we fill in your name from your Google profile. Your school still reviews every new account before it can be used.</li>
      </ul>
      <p>
        You can stop using Google sign-in at any time by removing SchoolMule from your Google
        account permissions page, and you can set a password instead with &ldquo;Forgot your
        password?&rdquo; on the sign-in page.
      </p>

      <h3>Signing in with Apple</h3>
      <p>
        In the SchoolMule iPhone app you can sign in with your Apple ID. Apple tells us an
        identifier for your Apple ID and, the first time, your name and email address. If you
        choose Hide My Email, the address is a private relay address that Apple forwards to you.
      </p>
      <ul>
        <li>We use the email address to find your SchoolMule account, or to create one when you sign up.</li>
        <li>We keep Apple&apos;s identifier so that your Apple ID keeps opening the same SchoolMule account. We receive no Apple password.</li>
      </ul>

      <h3>Google Sheets integration: what we request</h3>
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

      <h2>AI features</h2>
      <p>
        Two features use OpenAI&apos;s API to write text. The weekly summary parents see sends a
        child&apos;s name, the grades published that week, attendance counts, missing work and
        that week&apos;s teacher comments. Staff tools that draft report card comments or explain
        analytics send the student names, ratings and grades involved. Only what the feature
        needs is sent, never passwords or contact details. The summary is labelled
        as written by AI. Under OpenAI&apos;s API terms, data sent through its API is not used to
        train its models by default.
      </p>

      <h2>Service providers</h2>
      <p>
        We rely on a small number of providers to run the service, each with access only
        to what their function requires:
      </p>
      <ul>
        <li><strong>Supabase</strong> — database and file storage.</li>
        <li><strong>Railway</strong> — application hosting.</li>
        <li><strong>Vercel</strong> — website hosting and page-view analytics.</li>
        <li><strong>Resend</strong> — transactional email.</li>
        <li><strong>Expo</strong> — delivers the app&apos;s push notifications, through Apple&apos;s and Google&apos;s notification services.</li>
        <li><strong>OpenAI</strong> — the AI features described above.</li>
        <li><strong>Intuit QuickBooks</strong> — where a school connects QuickBooks Online, to show tuition balances.</li>
        <li><strong>Calendly</strong> — booking a demo from our website.</li>
        <li><strong>Google</strong> — when you choose to sign in with Google, and where a school has connected the optional Sheets integration described above.</li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep school data for as long as the school maintains an account with us. On
        request, or after an account closes, we delete or return it within a reasonable
        period, except where we are required to retain something by law.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed and never stored in readable form. Tokens for connected
        services (Google and QuickBooks) are encrypted at rest. Access is scoped so a staff account can only reach its own
        school&apos;s records. No system is perfectly secure, but we take these obligations
        seriously and design for isolation by default.
      </p>

      <h2>Children&apos;s information</h2>
      <p>
        SchoolMule holds information about students, supplied by their school. Where a
        school turns on the student portal, students sign in and add their own work, quiz
        answers and messages to their teachers; this becomes part of the school&apos;s record and
        is handled the same way. Requests concerning a student&apos;s information should go to the
        school, which is the owner of that record; we assist schools in responding.
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
