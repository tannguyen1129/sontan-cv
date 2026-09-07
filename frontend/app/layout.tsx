import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
const inter=Inter({subsets:["latin","vietnamese"],variable:"--font-sans"});
const mono=JetBrains_Mono({subsets:["latin","vietnamese"],variable:"--font-mono"});
export const metadata:Metadata={title:"Sơn Tân - System Engineer",description:"Portfolio song ngữ của Sơn Tân - System Engineer tại Thành phố Hồ Chí Minh.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi" className="scroll-smooth"><body className={`${inter.variable} ${mono.variable}`}>{children}</body></html>}
