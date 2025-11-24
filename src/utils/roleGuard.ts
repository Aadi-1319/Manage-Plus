export function requireRole(session: any, allowed: string[]) {
  const role = session?.user?.user_metadata?.role
  return allowed.includes(role)
}
