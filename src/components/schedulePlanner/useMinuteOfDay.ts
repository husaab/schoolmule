'use client'

import { useEffect, useState } from 'react'

const minuteOfDay = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Minutes since midnight, refreshed each minute so "now" markers stay honest. */
export const useMinuteOfDay = (): number => {
  const [now, setNow] = useState(minuteOfDay)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(minuteOfDay()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}
