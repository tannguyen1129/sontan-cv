import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
const inter=Inter({subsets:["latin","vietnamese"],variable:"--font-sans"});
const mono=JetBrains_Mono({subsets:["latin","vietnamese"],variable:"--font-mono"});
export const metadata:Metadata={title:"Sơn Tân — Full-stack Developer",description:"Portfolio cá nhân, kinh nghiệm, kỹ năng và những dự án nổi bật của Sơn Tân.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi" className="scroll-smooth"><body className={`${inter.variable} ${mono.variable}`}>{children}</body></html>}

