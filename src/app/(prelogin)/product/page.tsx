// File: src/app/product/page.tsx
'use client'
import { FC } from 'react'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const ProductPage: FC = () => {
  return (
    <>
      <PreNavBar />
      <main className="font-sans bg-gray-50 text-gray-800 py-40 px-6">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto text-center mb-15">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Complete Technical Overview
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Discover the comprehensive features, technical specifications, and implementation details 
            that make SchoolMule the most advanced school management platform available.
          </p>
        </section>
        {/* Feature Deep Dive */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="space-y-16">
            {/* Student Information System */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                <div className="lg:col-span-1">
                  <div className="flex items-center mb-6">
                    <div className="bg-cyan-100 rounded-lg p-3 mr-4">
                      <UserGroupIcon className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Student Information System</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Complete student lifecycle management from enrollment to graduation.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Comprehensive Profiles:</strong>
                        <span className="text-gray-600"> Demographics, contacts, medical info, academic history</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Family Management:</strong>
                        <span className="text-gray-600"> Parent/guardian relationships with multi-child families</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Bulk Operations:</strong>
                        <span className="text-gray-600"> Mass enrollment, class assignments, data updates</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Historical Tracking:</strong>
                        <span className="text-gray-600"> Multi-year academic records and progression</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-2 bg-gray-100 rounded-xl aspect-video overflow-hidden">
                  <Image
                    src="/images/StudentInterface.png"
                    alt="SchoolMule Student Management Interface showing student profiles and enrollment"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Gradebook & Assessment */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                <div className="lg:col-span-2 bg-gray-100 rounded-xl aspect-video overflow-hidden order-2 lg:order-1">
                  <Image
                    src="/images/GradebookScreenshot.png"
                    alt="SchoolMule Advanced Gradebook with weighted assessments and grade calculations"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="lg:col-span-1 order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 rounded-lg p-3 mr-4">
                      <ChartBarIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Advanced Gradebook System</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Sophisticated grade calculation with flexible weighting and standards-based grading support.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Weighted Categories:</strong>
                        <span className="text-gray-600"> Customizable assessment weights per class</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Real-time Calculations:</strong>
                        <span className="text-gray-600"> Instant grade updates and class averages</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Multi-term Support:</strong>
                        <span className="text-gray-600"> Semester, trimester, or custom term configurations</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Grade Analytics:</strong>
                        <span className="text-gray-600"> Performance trends and at-risk student identification</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Report Card Automation */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                <div className="lg:col-span-1">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 rounded-lg p-3 mr-4">
                      <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Report Card Automation</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Professional PDF report cards generated automatically with teacher feedback integration.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">One-Click Generation:</strong>
                        <span className="text-gray-600"> Bulk PDF creation for entire grades or classes</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Teacher Feedback:</strong>
                        <span className="text-gray-600"> Work habits, behavior, and custom comments</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Custom Templates:</strong>
                        <span className="text-gray-600"> School-specific branding and formatting</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Digital Distribution:</strong>
                        <span className="text-gray-600"> Secure parent portal access and email delivery</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-2 bg-gray-100 rounded-xl aspect-video overflow-hidden">
                  <Image
                    src="/images/ReportCardScreenshot.png"
                    alt="SchoolMule Report Card Generator showing PDF creation and teacher feedback"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Management */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                <div className="lg:col-span-2 bg-gray-100 rounded-xl aspect-video overflow-hidden order-2 lg:order-1">
                  <Image
                    src="/images/AttendanceScreenshot.png"
                    alt="SchoolMule Attendance Dashboard with real-time tracking and analytics"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="lg:col-span-1 order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 rounded-lg p-3 mr-4">
                      <ClockIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Smart Attendance Management</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Comprehensive attendance tracking with real-time analytics and automated reporting.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Dual Systems:</strong>
                        <span className="text-gray-600"> General school and class-specific attendance</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Real-time Analytics:</strong>
                        <span className="text-gray-600"> Instant attendance rates and trend analysis</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Automated Alerts:</strong>
                        <span className="text-gray-600"> Notify parents of absences and tardiness</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Compliance Reports:</strong>
                        <span className="text-gray-600"> State-required attendance documentation</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Financial Management */}
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                <div className="lg:col-span-1">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-100 rounded-lg p-3 mr-4">
                      <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Integrated Financial Management</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Complete tuition and payment management system with automated invoicing and tracking.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Tuition Plans:</strong>
                        <span className="text-gray-600"> Flexible payment schedules and pricing tiers</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Auto Invoicing:</strong>
                        <span className="text-gray-600"> Scheduled invoice generation and delivery</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Payment Tracking:</strong>
                        <span className="text-gray-600"> Real-time payment status and overdue management</span>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-gray-800">Financial Reports:</strong>
                        <span className="text-gray-600"> Revenue analytics and cash flow insights</span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-2 bg-gray-100 rounded-xl aspect-video overflow-hidden">
                  <Image
                    src="/images/TuitionScreenshot.png"
                    alt="SchoolMule Financial Dashboard showing tuition management and payment tracking"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Technical Specifications</h2>
              <p className="text-xl text-gray-600">Enterprise-grade requirements and capabilities</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">System Requirements</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Browser Support</h4>
                    <p className="text-sm text-gray-600">Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Network Requirements</h4>
                    <p className="text-sm text-gray-600">Minimum 1 Mbps per concurrent user</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Device Compatibility</h4>
                    <p className="text-sm text-gray-600">Desktop, tablet, and mobile responsive</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Operating Systems</h4>
                    <p className="text-sm text-gray-600">Windows, macOS, Linux, iOS, Android</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Performance & Scalability</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Response Time</h4>
                    <p className="text-sm text-gray-600"> 200ms average page load time</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Concurrent Users</h4>
                    <p className="text-sm text-gray-600">Unlimited with auto-scaling</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Data Storage</h4>
                    <p className="text-sm text-gray-600">Unlimited with automatic backups</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Uptime Guarantee</h4>
                    <p className="text-sm text-gray-600">99.9% SLA with monitoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-12">
            <div className="text-center mb-12">
              <ShieldCheckIcon className="h-16 w-16 text-red-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Security & Compliance</h2>
              <p className="text-xl text-gray-600">Enterprise-grade security for sensitive education data</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Data Protection</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 256-bit AES encryption</li>
                  <li>• SSL/TLS 1.3 transport</li>
                  <li>• End-to-end data protection</li>
                  <li>• Encrypted data at rest</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Access Control</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Role-based permissions</li>
                  <li>• Multi-factor authentication</li>
                  <li>• Session management</li>
                  <li>• Audit trail logging</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Compliance</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• FERPA compliant</li>
                  <li>• COPPA compliant</li>
                  <li>• SOC 2 Type II</li>
                  <li>• Regular security audits</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Process */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Implementation Process</h2>
              <p className="text-xl text-gray-600">Simple, guided setup with expert support</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-2xl text-cyan-600">1</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Initial Setup</h3>
                <p className="text-sm text-gray-600">School configuration, user accounts, and basic settings</p>
                <p className="text-xs text-gray-500 mt-2">1-2 days</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-2xl text-green-600">2</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Data Migration</h3>
                <p className="text-sm text-gray-600">Import existing student, staff, and historical data</p>
                <p className="text-xs text-gray-500 mt-2">1-2 days</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-2xl text-purple-600">3</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Training</h3>
                <p className="text-sm text-gray-600">Staff training sessions and documentation provided</p>
                <p className="text-xs text-gray-500 mt-2">1 week</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-2xl text-blue-600">4</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Go Live</h3>
                <p className="text-sm text-gray-600">Full system launch with ongoing support</p>
                <p className="text-xs text-gray-500 mt-2">Day 14</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-lg text-gray-600 mb-6">
                <strong>Total Implementation Time: 1.5 weeks</strong>
              </p>
              <p className="text-gray-600">
                Our implementation team guides you through every step, ensuring a smooth transition 
                with minimal disruption to your school operations.
              </p>
            </div>
          </div>
        </section>

        {/* Integration Capabilities */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Integration Capabilities</h2>
              <p className="text-xl text-gray-600">Connect with your existing systems</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <DocumentTextIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Data Export</h3>
                <p className="text-sm text-gray-600">CSV, Excel, PDF export capabilities</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <ArrowPathIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Data Sync</h3>
                <p className="text-sm text-gray-600">Real-time or scheduled data synchronization</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support & Training */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Ongoing Support & Training</h2>
              <p className="text-xl opacity-90">We&apos;re here to ensure your success</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Support Options</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    24/7 email support
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Phone support during business hours
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Live chat assistance
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Screen sharing sessions
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Training Resources</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Video tutorial library
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Live training webinars
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    Comprehensive documentation
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-3 opacity-90" />
                    On-site training available
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Ready to See SchoolMule in Action?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Schedule a personalized demo to see how SchoolMule can transform your school&apos;s operations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/demo" 
                className="px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition shadow-lg"
              >
                Schedule Technical Demo
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-300"
              >
                Contact Sales Team
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Questions about technical requirements? <a href='/contact' className='underline text-blue-500'>Contact us</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ProductPage