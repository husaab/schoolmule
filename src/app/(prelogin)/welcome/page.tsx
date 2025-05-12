// File: src/app/prelogin/welcome/page.tsx
'use client'
import { FC } from 'react';
import Link from 'next/link';
import PreNavBar from '@/components/prenavbar/navbar/Navbar';
import Footer from '@/components/prefooter/Footer';

const WelcomePage: FC = () => {
  return (
    <>
      {/* Pre-login navigation bar */}
      <PreNavBar />

      {/* Hero section */}
      <main className="font-sans flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="text-center space-y-6">
          {/* <Image
            src="/logo/schoolmulelogonavbar.png"
            alt="SchoolMule Logo"
            width={200}
            height={200}
            className="mx-auto h-32 w-auto"
          /> */}

          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to SchoolMule
          </h1>

            <video width="600" height="240" className='mx-auto'controls preload="none">
            <source src="/path/to/video.mp4" type="video/mp4" />
            <track
              src="/path/to/captions.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
            />
            Your browser does not support the video tag.
          </video>

          <p className="text-lg text-gray-600 max-w-xl">
            Simplify your school management with a unified platform for
            handling students, classes, schedules, and grades. Get started
            by logging in or creating a new account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="w-full sm:w-auto">
              <p className="block px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-sky-500 transition">
                Log In
              </p>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <p className="block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-300 transition">
                Sign Up
              </p>
            </Link>
          </div>
        </div>
      </main>
      <Footer/>
    </>
  );
};

export default WelcomePage;
