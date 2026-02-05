import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Clock, CreditCard } from "lucide-react";
import { getCompanyBySlug } from "@/app/actions/company";
import { formatPhone, paymentMethodLabels } from "@/lib/utils";
import { ScrollHeader } from "@/components/client/scroll-header";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InfoPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const address = company.address as any;
  const addressString = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}`;
  const encodedAddress = encodeURIComponent(addressString);
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8 pt-20">
      <ScrollHeader company={company} alwaysVisible />

      <div className="p-4 space-y-8">
        {/* Description */}
        <section>
          <h2 className="text-xl font-bold mb-2">{company.name}</h2>
          <p className="text-muted-foreground">{company.description}</p>
        </section>

        {/* Address */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <MapPin className="h-5 w-5" />
            <h3>Endereço</h3>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl">
            <p>
              {address.street}, {address.number}
            </p>
            <p>{address.neighborhood}</p>
            <p>
              {address.city} - {address.state}
            </p>
            {address.complement && (
              <p className="text-sm text-muted-foreground mt-1">
                {address.complement}
              </p>
            )}
          </div>

          <div className="w-full h-48 rounded-xl overflow-hidden border">
            <iframe
              width="100%"
              height="100%"
              src={mapUrl}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Phone className="h-5 w-5" />
            <h3>Contatos</h3>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl space-y-3">
            {company.phone &&
              company.phone.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(phone)}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Hours */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Clock className="h-5 w-5" />
            <h3>Horários de Funcionamento</h3>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl space-y-2">
            {(company.businessHours as any[]).map((hour: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-medium w-24">{hour.dayName}</span>
                {hour.isOpen ? (
                  <span>
                    {hour.openTime} às {hour.closeTime}
                  </span>
                ) : (
                  <span className="text-red-500">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CreditCard className="h-5 w-5" />
            <h3>Formas de Pagamento</h3>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl flex flex-wrap gap-2">
            {company.paymentMethods.map((method) => (
              <span
                key={method}
                className="px-3 py-1 bg-background rounded-full text-sm border"
              >
                {paymentMethodLabels[method] || method}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
