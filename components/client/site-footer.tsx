"use client";

import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="w-full mt-auto border-t bg-[#ce0707]">
      <div className="container max-w-lg mx-auto flex flex-col items-center justify-center p-2">
        <div className="relative w-12 h-12">
          <Image
            src="/images/logo-co.png"
            alt="Logo CO"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <div className="w-full bg-black p-2">
        <p className="text-xs text-white text-center">
          Desenvolvido por MB &copy; 2026 | Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
