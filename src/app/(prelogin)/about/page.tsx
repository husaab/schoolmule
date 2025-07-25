// File: src/app/about/page.tsx
'use client'
import { FC } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import { ShieldCheckIcon, AcademicCapIcon, UserGroupIcon, CheckCircleIcon, StarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

const AboutPage: FC = () => {
  return (
    <>
      <PreNavBar />

      <main className="font-sans bg-gray-50 text-gray-800 py-36 px-6">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Trusted by Schools Nationwide
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            SchoolMule was founded by educators who understand the daily challenges of school administration. 
            We're committed to building software that truly serves the education community.
          </p>
        </section>

        {/* Mission & Story */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  To eliminate administrative burden from education, allowing schools to focus entirely 
                  on student learning and development. We believe technology should simplify, not complicate, 
                  the educational process.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Founded in 2025 by former educators and technology experts, SchoolMule emerged from 
                  real-world experience with the frustrations of disconnected school management systems.
                </p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8">
                <div className="text-center">
                  <AcademicCapIcon className="h-20 w-20 text-cyan-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Education First</h3>
                  <p className="text-gray-600">
                    Every feature is designed with educators' real needs in mind, 
                    not just technical possibilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide every decision we make</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Simplicity</h3>
              <p className="text-gray-600">
                Complex problems deserve simple solutions. We prioritize intuitive design 
                over feature bloat.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-blue-100 rounded-full p-4 w-fit mx-auto mb-6">
                <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
              <p className="text-gray-600">
                Student data is sacred. Enterprise-grade security and FERPA compliance 
                are non-negotiable.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-purple-100 rounded-full p-4 w-fit mx-auto mb-6">
                <UserGroupIcon className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Community</h3>
              <p className="text-gray-600">
                Schools are communities. Our software strengthens connections between 
                students, parents, and educators.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center mb-12">
              <ShieldCheckIcon className="h-16 w-16 text-cyan-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Security & Compliance</h2>
              <p className="text-xl text-gray-600">Your data security is our highest priority</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-gray-800">FERPA Compliant</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Full compliance with Family Educational Rights and Privacy Act
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-gray-800">SSL Encryption</h3>
                </div>
                <p className="text-sm text-gray-600">
                  256-bit encryption for all data transmission and storage
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-gray-800">Role-Based Access</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Granular permissions ensure users only see what they should
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-gray-800">Daily Backups</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Automated backups with 99.9% uptime guarantee
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Success Stories */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">What Schools Are Saying</h2>
            <p className="text-xl text-gray-600">Real feedback from real educators</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-6 italic">
                "SchoolMule has completely transformed our administrative workflow. What used to take 
                our staff 3 hours now takes 20 minutes. The automated report cards alone have saved 
                us countless hours each semester."
              </p>
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-gray-600 font-bold">SB</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Sarah Bennett</p>
                  <p className="text-gray-600">Principal, Maplewood Elementary</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-6 italic">
                "The parent portal has revolutionized our parent engagement. Parents love having 
                real-time access to their child's progress, and it's reduced our administrative 
                phone calls by 80%."
              </p>
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-gray-600 font-bold">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Michael Rodriguez</p>
                  <p className="text-gray-600">Administrator, St. Mary's Academy</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Stats */}
        <section className="max-w-4xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-8">SchoolMule by the Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-lg opacity-90">Schools Served</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-lg opacity-90">Students Managed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-lg opacity-90">Uptime Record</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-lg opacity-90">Support Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">Educators and technologists working together</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-cyan-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BuildingOfficeIcon className="h-12 w-12 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Education Experts</h3>
              <p className="text-gray-600">
                Former principals, teachers, and administrators who understand school operations
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Technology Leaders</h3>
              <p className="text-gray-600">
                Senior engineers from top tech companies, specializing in education software
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Customer Success</h3>
              <p className="text-gray-600">
                Dedicated support team available to help your school succeed with SchoolMule
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Ready to Join Our Growing Community?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Experience the difference that purpose-built school management software can make.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/demo" 
                className="px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition shadow-lg"
              >
                Schedule Demo
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-300"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default AboutPage