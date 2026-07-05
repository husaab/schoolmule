'use client'
import { ComponentType, FC, SVGProps } from 'react'
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  CalculatorIcon,
  GlobeAltIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PencilIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface FloatingIcon {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  top: string
  left: string
  size: number
  color: string
  animation: string
  duration: string
  delay: string
  opacity: number
  mobileHidden?: boolean
}

// Positions stay in the outer ~15% side bands so the icons never sit under the
// headline or CTAs. Negative delays start every loop mid-cycle to avoid a
// synchronized "pop" on load.
const floatingIcons: FloatingIcon[] = [
  { Icon: AcademicCapIcon, top: '12%', left: '6%', size: 48, color: 'text-cyan-600', animation: 'animate-hero-drift', duration: '12s', delay: '-3s', opacity: 0.22 },
  { Icon: BookOpenIcon, top: '30%', left: '12%', size: 40, color: 'text-teal-600', animation: 'animate-hero-drift-reverse', duration: '14s', delay: '-6s', opacity: 0.18, mobileHidden: true },
  { Icon: GlobeAltIcon, top: '46%', left: '4%', size: 44, color: 'text-teal-600', animation: 'animate-hero-drift', duration: '15s', delay: '-10s', opacity: 0.16 },
  { Icon: PencilIcon, top: '64%', left: '9%', size: 32, color: 'text-amber-500', animation: 'animate-hero-drift', duration: '10s', delay: '-4s', opacity: 0.2, mobileHidden: true },
  { Icon: CalculatorIcon, top: '82%', left: '14%', size: 36, color: 'text-cyan-600', animation: 'animate-hero-drift-reverse', duration: '13s', delay: '-8s', opacity: 0.15 },
  { Icon: SparklesIcon, top: '6%', left: '20%', size: 26, color: 'text-amber-500', animation: 'animate-hero-drift-reverse', duration: '11s', delay: '-2s', opacity: 0.2, mobileHidden: true },
  { Icon: LightBulbIcon, top: '9%', left: '82%', size: 32, color: 'text-amber-500', animation: 'animate-hero-drift', duration: '11s', delay: '-5s', opacity: 0.22 },
  { Icon: AcademicCapIcon, top: '22%', left: '89%', size: 40, color: 'text-teal-600', animation: 'animate-hero-drift-reverse', duration: '13s', delay: '-9s', opacity: 0.18, mobileHidden: true },
  { Icon: PaperAirplaneIcon, top: '42%', left: '93%', size: 34, color: 'text-cyan-600', animation: 'animate-hero-drift', duration: '14s', delay: '-7s', opacity: 0.18 },
  { Icon: BeakerIcon, top: '60%', left: '87%', size: 42, color: 'text-teal-600', animation: 'animate-hero-drift-reverse', duration: '12s', delay: '-4s', opacity: 0.16, mobileHidden: true },
  { Icon: BookOpenIcon, top: '80%', left: '92%', size: 32, color: 'text-amber-500', animation: 'animate-hero-drift', duration: '15s', delay: '-11s', opacity: 0.15 },
  { Icon: PencilIcon, top: '90%', left: '82%', size: 28, color: 'text-cyan-600', animation: 'animate-hero-drift-reverse', duration: '12s', delay: '-6s', opacity: 0.16, mobileHidden: true },
]

const HeroBackground: FC = () => {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-white to-slate-50" />

      {/* Decorative blobs — positioning transform lives on the wrapper so the
          drift animation on the inner div doesn't override it */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
        <div className="w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl animate-hero-blob" />
      </div>
      <div className="absolute top-1/4 right-0 translate-x-1/2">
        <div
          className="w-80 h-80 bg-amber-100/30 rounded-full blur-3xl animate-hero-blob"
          style={{ animationDuration: '30s', animationDelay: '-12s' }}
        />
      </div>
      <div className="absolute bottom-0 left-1/3">
        <div
          className="w-72 h-72 bg-teal-100/30 rounded-full blur-3xl animate-hero-blob"
          style={{ animationDuration: '26s', animationDelay: '-7s' }}
        />
      </div>

      {/* Floating education icons */}
      {floatingIcons.map(
        ({ Icon, top, left, size, color, animation, duration, delay, opacity, mobileHidden }, index) => (
          <div
            key={index}
            className={`absolute ${animation}${mobileHidden ? ' hidden sm:block' : ''}`}
            style={{ top, left, animationDuration: duration, animationDelay: delay }}
          >
            <Icon className={color} style={{ width: size, height: size, opacity }} />
          </div>
        )
      )}
    </div>
  )
}

export default HeroBackground
