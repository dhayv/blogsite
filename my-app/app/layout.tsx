import type { Metadata } from "next";
import "./globals.css";
import Header from "./header";
import RecentPost from "./recentpost";

export const metadata: Metadata = {
  title: "David Hyppolite's Blog",
  description: "A blog documenting the journey of a self-taught Cloud Engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
          <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 pb-20 gap-10 sm:p-16 font-[family-name:var(--font-geist-sans)]">
          <Header/>
          <main>{children}</main>
          <RecentPost/>
          
          <footer className="flex gap-6 flex-wrap items-center justify-center"> 
            © {new Date().getFullYear()} . All rights reserved.</footer>
          </div>
  );
}
