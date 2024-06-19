import type { Metadata } from "next";
import "./globals.css";
import MainHeader from '@/components/MainHeader';

export const metadata: Metadata = {
  title: "LiveOverlay App",
  description: "This is a project by Harshdeep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className='bg-gray-500 w-full min-h-screen'>
        <MainHeader></MainHeader>
        <div className="flex justify-between">
            {/* flex-1 class below helps to grow a box to fit remaining size */}
            <main className='bg-gray-700 flex-1'>{children}</main> 

            <aside className='bg-blue-700'>
                <h1>Aside layout</h1>
            </aside>
        </div>
      </body>
    </html>
  );
}
