"use client";

import Image from "next/image";
import { useRestaurant } from "@/components/client/restaurant-context";
import { Instagram, Facebook } from "lucide-react";

export function SiteFooter() {
  const { company } = useRestaurant();

  return (
    <footer className="w-full mt-auto border-t bg-brand">
      <div className="container max-w-lg mx-auto flex items-center justify-between p-4">
        {/* Lado Esquerdo: Logo */}
        <div className="relative w-12 h-12 bg-white rounded-full overflow-hidden shadow-sm">
          <Image
            src={company?.profileImage || "/images/logo-co.png"}
            alt={company?.name || "Logo"}
            fill
            className="object-cover"
          />
        </div>

        {/* Lado Direito: Redes Sociais */}
        <div className="flex items-center gap-4 text-white">
          {company?.instagram && (
            <a
              href={
                company.instagram.startsWith("http")
                  ? company.instagram
                  : `https://instagram.com/${company.instagram.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="/images/instagram.png"
                alt="Instagram"
                width={24}
                height={24}
                className="w-8 h-8 bg-white rounded-full p-1"
              />
            </a>
          )}
          {company?.facebook && (
            <a
              href={
                company.facebook.startsWith("http")
                  ? company.facebook
                  : `https://facebook.com/${company.facebook}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="/images/facebook.png"
                alt="Facebook"
                width={24}
                height={24}
                className="w-8 h-8 bg-white rounded-full p-1"
              />
            </a>
          )}
        </div>
      </div>
      <div className="w-full bg-white p-2">
        <p className="text-xs text-black text-center font-medium">
          Desenvolvido por{" "}
          <a href="#" className="text-[#2301c0] font-bold">
            MB
          </a>{" "}
          &copy; 2026 | Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
