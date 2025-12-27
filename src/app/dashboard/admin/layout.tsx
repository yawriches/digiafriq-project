export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware enforces admin role - just render
  return <>{children}</>
}
