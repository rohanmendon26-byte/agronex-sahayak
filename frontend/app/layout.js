import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ToastConfig from "@/components/ToastConfig";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AgroNex Sahayak | Community & Senior Citizen Assistance",
  description: "AI-Powered Community Assistance & SOS Network for Senior Citizens, Volunteers, and Emergency Services",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
        <Navbar />
        <div className="flex-1 pb-20 md:pb-8">{children}</div>
        <MobileBottomNav />
        <ToastConfig />
      </body>
    </html>
  );
}
