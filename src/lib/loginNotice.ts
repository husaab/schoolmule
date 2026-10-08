// Query param the login page reads to explain a forced sign-out, e.g.
// /login?notice=approved. Kept apart from services/sessionExpiry so the login
// page can import it without pulling every store into its bundle.
export const LOGIN_NOTICE_PARAM = 'notice'
export const LOGIN_NOTICE_APPROVED = 'approved'
