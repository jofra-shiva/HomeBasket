import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HomeBasket – Sign In",
  description: "Sign in to your HomeBasket smart household expense tracker",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-root">
      <div className="auth-center">
        {children}
      </div>
    </div>
  );
}
