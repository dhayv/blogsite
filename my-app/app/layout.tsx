import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./header";
import RecentPost from "./recentpost";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

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
    <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 pb-20 gap-10 sm:p-16 font-[family-name:var(--font-geist-sans)]">
          <Header/>
          <main>{children}</main>
          <RecentPost/>
          
          <footer className="flex gap-6 flex-wrap items-center justify-center"> 
            © {new Date().getFullYear()} . All rights reserved.</footer>
          </div>
         
        </body>
    </html>
  );
}
