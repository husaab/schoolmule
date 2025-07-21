// File: src/app/signup/page.tsx
'use client'

import { FC, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { RegisterRequest, RegisterResponse } from '@/services/types/auth'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { register as registerUser } from '@/services/authService'
import {
  faEye,
  faEyeSlash
} from "@fortawesome/free-solid-svg-icons";

interface SignUpFormInputs {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  school: string
  role: string
}

const SignupPage: FC = () => {
  return (
    <>
      <PreNavBar />
      <main className="font-sans flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="w-full mt-40 mb-20 max-w-lg bg-white p-10 rounded-lg shadow-lg">
          <h2 className="text-3xl text-black font-bold text-center mb-8">Create Your SchoolMule Account</h2>
          <SignUpForm />
          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

const SignUpForm: FC = () => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const setUser = useUserStore.getState().setUser
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormInputs>()

  const onSubmit: SubmitHandler<SignUpFormInputs> = async data => {
    const registrationData: RegisterRequest = {
      username: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      school: data.school
    }
    try {
      const response: RegisterResponse = await registerUser(registrationData);
      console.log(response);
      showNotification(response.success ? "Registration Successful" : "Registration Failed", response.success ? "success" : "error");
      if (response.success) {
        const user = {
          id: response.data.userId,              // ✅ mapped to `id`
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          school: response.data.school,
          isVerifiedEmail: response.data.isVerified,
          isVerifiedSchool: response.data.isVerifiedSchool,
          activeTerm: response.data.activeTerm
        };
        setUser(user);
        router.replace('/verify-email');
      }
    } catch (err: any) {
      showNotification(err.message || 'Sign up failed', 'error')
    }
  }

  const schools = [
    { value: '', label: 'Select your school' },
    { value: 'ALHAADIACADEMY', label: 'Al Haadi Academy' },
    { value: 'ALRASOOLACADEMY', label: 'Al Rasool' },
    { value: 'JCC', label: 'Jaafari Community Centre (JCC)' },
    { value: 'PLAYGROUND', label: 'Playground Testing'}
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-lg font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          {...register('fullName', { required: 'Full name is required' })}
          placeholder='ex. John Doe'
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder='ex. johndoe@gmail.com'
          {...register('email', { required: 'Email is required' })}
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div className="relative">
        <label htmlFor="password" className="block text-lg font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          placeholder='*********'
          type={showPassword ? 'text' : 'password'}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum length is 6' }
          })}
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-13 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                    <FontAwesomeIcon icon={faEye}/>
                  ) : (
                    <FontAwesomeIcon icon={faEyeSlash}/>
                  )}
                </button>
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-lg font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value =>
              value === watch('password') || 'Passwords do not match'
          })}
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>


      <div>
        <label htmlFor="school" className="block text-lg font-medium text-gray-700">
          School
        </label>
        <select
          id="school"
          defaultValue=""
          {...register('school', { required: 'Please select your school' })}
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 bg-white"
        >
          <option value="" hidden>
            Select your school
          </option>
          {schools.map(s => (
            <option key={s.value} value={s.value} disabled={!s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.school && <p className="text-red-600 text-sm mt-1">{errors.school.message}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-lg font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          {...register('role', { required: 'Please select your role' })}
          className="mt-1 block w-full text-black border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 bg-white"
        >
          <option value="" disabled>Select your role</option>
          <option value="TEACHER">Teacher</option>
          <option value="PARENT">Parent</option>
        </select>
        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition disabled:opacity-50"
      >
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}

export default SignupPage
