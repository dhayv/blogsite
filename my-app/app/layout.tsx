import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./header";

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
        <Header/>
        <main className="flex-grow">{children}</main>
        <footer className="flex gap-6 flex-wrap items-center justify-center"> 
          © {new Date().getFullYear()} David Hyppolite. All rights reserved.</footer>

      </body>
    </html>
  );
}
