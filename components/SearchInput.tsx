"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import React, { useEffect, useState } from "react";

const SearchInput = () => {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("topic") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);

  // Debounce logic
  useEffect(() => {
    const delay = setTimeout(() => {
      const queryIsEmpty = searchQuery.trim() === "";

      if (!queryIsEmpty) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "topic",
          value: searchQuery.trim(),
        });
        router.push(newUrl, { scroll: false });
      } else {
        // Clear the query if input is empty
        if (path === "/companions") {
          const newUrl = removeKeysFromUrlQuery({
            params: searchParams.toString(),
            keysToRemove: ["topic"],
          });
          router.push(newUrl, { scroll: false });
        }
      }
    }, 500); // debounce time in ms

    return () => clearTimeout(delay);
  }, [searchQuery, router, searchParams, path]);

  return (
    <div className="relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit">
      <Image
        src="/icons/search.svg"
        alt="search"
        width={15}
        height={15}
        className="h-auto w-auto max-w-none shrink-0"
      />
      <input
        placeholder="Search Companion..."
        className="outline-none w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
