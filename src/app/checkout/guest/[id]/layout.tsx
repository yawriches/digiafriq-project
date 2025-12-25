export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No dashboard layout for checkout - just render children directly
  return <>{children}</>;
}
