import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { MapPin, CircleDollarSign } from "lucide-react";
import { getCompanies } from "@/app/actions/company";
import { Address } from "@/lib/types";

export default async function HomePage() {
  const companies = await getCompanies();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-primary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            Cardápio Digital
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Encontre os melhores restaurantes e faça seu pedido
          </p>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Restaurantes</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => {
            const address = company.address as unknown as Address;
            return (
              <Link
                key={company.id}
                href={`/${company.slug}`}
                className="block bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Banner */}
                <div className="relative h-32">
                  <Image
                    src={company.bannerImage || "/placeholder.svg"}
                    alt={company.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

                  {/* Logo */}
                  <div className="absolute -bottom-6 left-4">
                    <div className="relative h-14 w-14 rounded-full border-2 border-background overflow-hidden bg-background">
                      <Image
                        src={company.profileImage || "/placeholder.svg"}
                        alt={company.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="pt-8 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">
                      {company.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        company.isOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {company.isOpen ? "Aberto" : "Fechado"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {company.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{address.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CircleDollarSign className="h-4 w-4" />
                      <span>Min. {formatCurrency(company.minimumOrder)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Access Links */}
        <div className="mt-8 border-t pt-8">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Acesso Rápido
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/empresa"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Painel da Empresa
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Painel Admin
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
