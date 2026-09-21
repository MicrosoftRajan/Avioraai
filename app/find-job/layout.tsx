import { SmoothCursor } from "@/components/ui/smooth-cursor";
import type { ReactNode } from "react";

export default function FindJobLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <SmoothCursor />
      {children}
    </>
  );
}
