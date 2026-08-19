import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 宜蘭員旅",
  description: "8 月 29 日至 30 日的宜蘭員工旅遊行程小手冊。",
  icons: {
    icon: "/assets/yilan/背包_active.svg",
    shortcut: "/assets/yilan/背包_active.svg",
  },
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#80bb82",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
