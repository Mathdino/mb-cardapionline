import { SiteFooter } from "@/components/client/site-footer";

export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
