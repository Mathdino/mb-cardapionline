"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import type { Company } from "@/lib/types";

interface ScrollHeaderProps {
  company: Company;
  onSearch: (query: string) => void;
}

export function ScrollHeader({ company, onSearch }: ScrollHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery("");
      onSearch("");
    } else {
      setIsSearchActive(true);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background shadow-sm transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        {isSearchActive ? (
          <div className="flex items-center w-full gap-2">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 h-10 px-4 rounded-full bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
              autoFocus
            />
            <button
              onClick={toggleSearch}
              className="p-2 hover:bg-secondary rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Menu className="h-6 w-6" />
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border">
                  <Image
                    src={company.profileImage || "/placeholder.svg"}
                    alt={company.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h1 className="font-bold text-sm truncate max-w-[150px]">
                  {company.name}
                </h1>
              </div>
            </div>
            <button
              onClick={toggleSearch}
              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-sm"
            >
              <Search className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
