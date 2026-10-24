// src/lib/websiteVisit.ts
// A signed-in user who arrives at the website (typing schoolmule.ca, a
// bookmark, a link from elsewhere) belongs in the app, so the website pages
// (WEBSITE_PATHS) send them to their home page. One who chooses the website
// from inside the app (the sidebar's "SchoolMule website", which opens
// VIEW_WEBSITE_HREF in a new tab) browses it freely for the rest of that tab.
//
// Two places apply the rule, and both read it from here:
//   - WEBSITE_REDIRECT_SCRIPT runs in the root layout's <head>, so a fresh
//     page load redirects before anything paints (no landing-page flash).
//   - components/landing/WebsiteRedirect covers client-side navigation onto a
//     website page (the logo, the footer, "Go home"), where no script runs.
// websiteVisit.test.ts runs the script against every user state and checks
// that it ends where websiteRedirect does.

import { WEBSITE_PATHS, resolveRedirect, roleHome, type RouteState } from '@/lib/authRouting'

// ?website on a website page starts a visit. It has to be in the URL: a link
// opened in a new tab starts with empty sessionStorage.
export const VIEW_WEBSITE_PARAM = 'website'
export const VIEW_WEBSITE_HREF = `/?${VIEW_WEBSITE_PARAM}=1`

// Per tab, so the visit ends with the tab and the app's own tab never has one.
const VISIT_KEY = 'sm.websiteVisit'

// Where the session lives: services/authService (the token) and the persisted
// useUserStore ('user-storage'). The script can't import those, so the test
// checks these against the real store.
export const TOKEN_KEY = 'auth_token'
export const USER_STORAGE_KEY = 'user-storage'

// Set on window by the script once it has started a redirect, so
// WebsiteRedirect doesn't start a second navigation over it.
const SCRIPT_REDIRECT_FLAG = '__smWebsiteRedirect'

// Storage can be unavailable (private mode, blocked site data). A visit then
// lasts as long as the ?website page itself.
export const isVisitingWebsite = (): boolean => {
  try {
    return window.sessionStorage.getItem(VISIT_KEY) === '1'
  } catch {
    return false
  }
}

export const startWebsiteVisit = (): void => {
  try {
    window.sessionStorage.setItem(VISIT_KEY, '1')
  } catch {
    // See isVisitingWebsite.
  }
}

export const scriptIsRedirecting = (): boolean =>
  Boolean((window as unknown as Record<string, unknown>)[SCRIPT_REDIRECT_FLAG])

// Where a user on `path` goes instead, or null to stay. Off the website, or
// while visiting it, nothing happens; on it, the app's own routing rules
// decide (signed out stays, signed in goes home or to their onboarding step).
export const websiteRedirect = (path: string, state: RouteState, visiting: boolean): string | null =>
  WEBSITE_PATHS.includes(path) && !visiting ? resolveRedirect(path, state) : null

const scriptConfig = {
  paths: WEBSITE_PATHS,
  param: VIEW_WEBSITE_PARAM,
  visitKey: VISIT_KEY,
  tokenKey: TOKEN_KEY,
  userKey: USER_STORAGE_KEY,
  flag: SCRIPT_REDIRECT_FLAG,
  homes: { PARENT: roleHome('PARENT'), STUDENT: roleHome('STUDENT') },
  staffHome: roleHome(null),
}

// Plain ES5 that runs before the page parses. It goes to the role's home, not
// the onboarding step: AuthGuard there finishes the job (websiteVisit.test.ts
// checks both end on the same page). Hiding the body keeps the landing page
// from painting while the next page loads. Any storage error means "stay".
export const WEBSITE_REDIRECT_SCRIPT = `(function(c){
if(c.paths.indexOf(location.pathname)<0)return;
var visiting=new URLSearchParams(location.search).has(c.param);
try{if(visiting)sessionStorage.setItem(c.visitKey,'1');else visiting=sessionStorage.getItem(c.visitKey)==='1'}catch(e){}
if(visiting)return;
try{
if(!localStorage.getItem(c.tokenKey))return;
var s=JSON.parse(localStorage.getItem(c.userKey)),u=s&&s.state&&s.state.user;
if(!u||!u.id)return;
var home=Object.prototype.hasOwnProperty.call(c.homes,u.role)?c.homes[u.role]:c.staffHome;
window[c.flag]=home;
var hide=document.createElement('style');hide.textContent='body{visibility:hidden}';document.head.appendChild(hide);
location.replace(home);
}catch(e){}
})(${JSON.stringify(scriptConfig)});`
