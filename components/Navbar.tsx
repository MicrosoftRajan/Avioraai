'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const Navbar = () => {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image
            src="/images/favicon-32x32.png"
            alt="Aviora Logo"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-6 max-md:gap-4">
        <NavItems />
        <AnimatedThemeToggler
          variant="circle"
          duration={420}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-foreground shadow-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-white"
          aria-label="Toggle theme"
        />
        {isLoaded && !isSignedIn ? (
          <SignInButton>
            <button className="btn-signin" type="button">Sign In</button>
          </SignInButton>
        ) : null}

        {isLoaded && isSignedIn ? <UserButton /> : null}
      </div>
    </nav>
  );
};

export default Navbar;
