import { SmoothCursor } from "@/components/ui/smooth-cursor";

export default function InterviewModeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SmoothCursor />
      {children}
    </>
  );
}
