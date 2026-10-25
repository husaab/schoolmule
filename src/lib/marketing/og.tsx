/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image doesn't apply */
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Open Graph images for the website, rendered at build time: the page's
// heading in Outfit with the film's serif accent, beside a frame of the film.
// Fonts are Outfit and Instrument Serif (SIL OFL), Latin subset, in og-fonts/.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const root = process.cwd()
const asset = (p: string) => readFile(path.join(root, p))
const dataUri = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString('base64')}`

interface OgOptions {
  /** Heading before the accent. */
  title: string
  /** Serif italic phrase that ends the heading. */
  accent?: string
  sub: string
  /** A frame from the film or a screen, under public/. */
  image?: string
  /** Pill above the heading. */
  pill?: string
  accentColour?: string
}

export async function ogImage({ title, accent, sub, image = '/videos/schoolmule-demo-poster.jpg', pill, accentColour = '#0e7490' }: OgOptions) {
  const [semi, regular, serif, mark, shot] = await Promise.all([
    asset('src/lib/marketing/og-fonts/Outfit-SemiBold.woff'),
    asset('src/lib/marketing/og-fonts/Outfit-Regular.woff'),
    asset('src/lib/marketing/og-fonts/InstrumentSerif-Italic.woff'),
    asset('public/marketing/mule-mark.png'),
    asset(path.join('public', image)),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(180deg, #f2f8f9 0%, #ffffff 70%)',
          fontFamily: 'Outfit',
          color: '#0b1324',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '56px 0 52px 64px', width: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={dataUri(mark, 'image/png')} width={58} height={44} alt="" />
            <span style={{ fontSize: 30, fontWeight: 600, color: '#0b3b52', letterSpacing: -0.6 }}>SchoolMule</span>
          </div>
          {pill && (
            <div
              style={{
                display: 'flex',
                marginTop: 40,
                alignSelf: 'flex-start',
                fontSize: 20,
                color: '#0b3b52',
                background: '#ffffff',
                border: '1.5px solid #c8e6ec',
                borderRadius: 999,
                padding: '6px 16px',
              }}
            >
              {pill}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: pill ? 22 : 56,
              fontSize: 62,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: -2.2,
            }}
          >
            <span>{title}</span>
            {accent && (
              <span style={{ fontFamily: 'Instrument Serif', fontWeight: 400, color: accentColour, letterSpacing: -0.5 }}>
                {accent}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 26, lineHeight: 1.4, color: '#475569', fontWeight: 400 }}>{sub}</div>
          <div style={{ display: 'flex', marginTop: 'auto', fontSize: 22, color: '#64748b' }}>schoolmule.ca</div>
        </div>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 700,
            top: 92,
            width: 640,
            height: 446,
            padding: 9,
            borderRadius: 26,
            background: 'rgba(11,19,36,0.05)',
          }}
        >
          <img
            src={dataUri(shot, 'image/jpeg')}
            width={622}
            height={428}
            alt=""
            style={{ borderRadius: 18, objectFit: 'cover', objectPosition: 'left top', boxShadow: '0 30px 60px -30px rgba(11,59,82,0.45)' }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Outfit', data: semi, weight: 600, style: 'normal' },
        { name: 'Outfit', data: regular, weight: 400, style: 'normal' },
        { name: 'Instrument Serif', data: serif, weight: 400, style: 'italic' },
      ],
    },
  )
}
