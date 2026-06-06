'use client'
import { FC } from 'react';
import Image from 'next/image';
import { getSchoolLogo, getSchoolName } from '@/lib/schoolUtils';

interface SchoolLogoProps {
  /** School enum code (e.g. "ALHAADIACADEMY"). Null renders a neutral fallback. */
  schoolCode: string | null;
  /** Rendered square size in px. Defaults to 40. */
  size?: number;
  /** Extra classes for the outer container. */
  className?: string;
}

/**
 * Tenant brand mark. Renders the school's configured logo when one exists,
 * otherwise an initial-letter avatar using the SchoolMule brand gradient so
 * every tenant still looks intentional. Reusable across header, login, etc.
 */
const SchoolLogo: FC<SchoolLogoProps> = ({ schoolCode, size = 40, className = '' }) => {
  const logoSrc = getSchoolLogo(schoolCode);
  const dimensions = { width: size, height: size };

  if (logoSrc) {
    return (
      <div
        style={dimensions}
        className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden ${className}`}
      >
        <Image
          src={logoSrc}
          alt={schoolCode ? getSchoolName(schoolCode) : 'School logo'}
          width={size}
          height={size}
          unoptimized
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  const initial = (schoolCode ? getSchoolName(schoolCode) : 'S').charAt(0).toUpperCase();

  return (
    <div
      style={dimensions}
      className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-semibold ${className}`}
    >
      {initial}
    </div>
  );
};

export default SchoolLogo;
