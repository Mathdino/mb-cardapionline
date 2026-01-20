import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Clock, CreditCard } from "lucide-react";
import { getCompanyBySlug } from "@/app/actions/company";
import { formatPhone, paymentMethodLabels } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InfoPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const addressString = `${company.address.street}, ${company.address.number}, ${company.address.neighborhood}, ${company.address.city}, ${company.address.state}`;
  const encodedAddress = encodeURIComponent(addressString);
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 flex items-center gap-4">
        <Link 
          href={`/${slug}`}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold">Informações do Restaurante</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Description */}
        <section>
          <h2 className="text-xl font-bold mb-2">{company.name}</h2>
          <p className="text-muted-foreground">{company.description}</p>
        </section>

        {/* Address & Map */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            <h2>Localização</h2>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="font-medium">{company.address.street}, {company.address.number}</p>
            <p className="text-muted-foreground">
              {company.address.neighborhood} - {company.address.city}/{company.address.state}
            </p>
            <p className="text-muted-foreground">CEP: {company.address.cep}</p>
          </div>

          <div className="w-full h-64 rounded-lg overflow-hidden border bg-secondary/20">
            <iframe
              width="100%"
              height="100%"
              src={mapUrl}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* Phones */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Phone className="h-5 w-5" />
            <h2>Contatos</h2>
          </div>
          
          <div className="space-y-2">
            {company.phone.map((phone, i) => (
              <a 
                key={i} 
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatPhone(phone)}</span>
              </a>
            ))}
            {company.whatsapp && (
              <a 
                href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-green-50/50 border border-green-100 rounded-lg hover:bg-green-50 transition-colors"
              >
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
            )}
          </div>
        </section>

        {/* Business Hours */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            <h2>Horários de Funcionamento</h2>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            {company.businessHours.map((day: any) => (
              <div 
                key={day.dayOfWeek} 
                className="flex justify-between items-center text-sm"
              >
                <span className="font-medium">{day.dayName}</span>
                <span className={day.isOpen ? "text-foreground" : "text-muted-foreground"}>
                  {day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Fechado'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5" />
            <h2>Formas de Pagamento</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {company.paymentMethods.map((method: string) => (
              <span 
                key={method} 
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
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