import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center py-12">
      <SignUp />
    </main>
  );
}
