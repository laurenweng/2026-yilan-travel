import type { ReactNode } from "react";

type PixelFrameProps = {
  children: ReactNode;
  className?: string;
};

/** 統一旅程卡與資訊框的像素邊線，避免各頁重複設定。 */
export const PixelFrame = ({ children, className = "" }: PixelFrameProps) => (
  <section className={`pixel-frame ${className}`.trim()}>{children}</section>
);
