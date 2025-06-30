'use client'
import React, { useEffect, useState, FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import PreNavBar from '@/components/prenavbar/navbar/Navbar'
import Footer from '@/components/prefooter/Footer'
import Link from 'next/link';
import { login } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash
} from "@fortawesome/free-solid-svg-icons";

interface LoginFormInputs {
  email: string
  password: string
}

const LoginPage: FC = () => {
  return (
    <>
      <PreNavBar />
      <main className="font-sans flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-lg bg-white p-10 rounded-lg shadow-lg">
          <h2 className="text-3xl text-black font-bold text-center mb-8">Log in to SchoolMule</h2>
          <LoginForm />
          <p className="text-center mt-6 text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

const LoginForm: FC = () => {
  const router = useRouter()
  const showNotification = useNotificationStore(state => state.showNotification)
  const setUser = useUserStore.getState().setUser
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>()

  const onSubmit: SubmitHandler<LoginFormInputs> = async data => {
    try {
      const response = await login(data)
      if(response.success){
         const user = {
          id: response.data.userId,              // ✅ mapped to `id`
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          school: response.data.school,
          isVerifiedEmail: response.data.isVerified,
          isVerifiedSchool: response.data.isVerifiedSchool
        };
        setUser(user);
        showNotification('Logged in successfully', 'success')
        if(!user.isVerifiedEmail) {
          router.replace("/verify-email")
        } else if(user.isVerifiedEmail) {
          if(!user.isVerifiedSchool) {
            router.replace("/school-approval")
          } else {
            if(user.role == 'PARENT'){
              router.replace("/parent-home")
            } else{
              router.replace("/dashboard")
            }
          }
        }
      }
    } catch (err: any) {
      showNotification('Login failed, invalid email or password', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder='ex. johndoe@gmail.com'
          {...register('email', { required: 'Email is required' })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-black focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
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
          {...register('password', { required: 'Password is required' })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-black focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
        >
          {showPassword ? (
            <FontAwesomeIcon icon={faEye}/>
          ) : (
            <FontAwesomeIcon icon={faEyeSlash}/>
          )}
        </button>
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        <p className="text-left text-black mt-2 text-sm">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password? Click here
          </Link>
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-cyan-600 cursor-pointer text-white font-semibold rounded-md hover:bg-cyan-700 transition disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  )
}

export default LoginPage
