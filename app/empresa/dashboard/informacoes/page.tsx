"use client";

import React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { paymentMethodLabels, defaultBusinessHours } from "@/lib/mock-data";
import type { Company, PaymentMethod, BusinessHours } from "@/lib/types";
import {
  Save,
  Plus,
  Trash2,
  ImageIcon,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Building2,
  MapPin,
  Clock,
  Smartphone,
  Settings,
  Palette,
  CreditCard,
  ChevronRight,
  Utensils,
  IceCreamCone,
  Pizza,
  Croissant,
  Fish,
  CakeSlice,
  Drumstick,
  ChefHat,
  LayoutGrid,
  CircleDot,
} from "lucide-react";

// Ícone de Hambúrguer personalizado
const BurgerIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 11h10" />
    <path d="M11 15h2" />
    <path d="M12 3a8 8 0 0 1 8 8c0 .3-.1.6-.2.8-.2.6-.9 1.2-1.8 1.2H6c-.9 0-1.6-.6-1.8-1.2-.1-.2-.2-.5-.2-.8a8 8 0 0 1 8-8Z" />
    <path d="M4 18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1c0-.6-.4-1-1-1H5c-.6 0-1 .4-1 1v1Z" />
  </svg>
);

import { Button } from "@/components/ui/button";
import { formatPhone, getCroppedImg } from "@/lib/utils";
import { updateCompany, getCompanyById } from "@/app/actions/company";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { FoodLoading } from "@/components/ui/food-loading";

const segments = [
  { id: "Marmita", label: "Marmita", icon: Utensils },
  { id: "Acai e Sorvete", label: "Açaí e Sorvete", icon: IceCreamCone },
  { id: "Pizzaria", label: "Pizzaria", icon: Pizza },
  { id: "Hamburgueria", label: "Hamburgueria", icon: BurgerIcon },
  { id: "Pastelaria", label: "Pastelaria", icon: Croissant },
  { id: "Japa", label: "Japa", icon: Fish },
  { id: "Bolos e Doces", label: "Bolos e Doces", icon: CakeSlice },
  { id: "Salgadinhos", label: "Salgadinhos", icon: Drumstick },
  { id: "Outros", label: "Outros", icon: ChefHat },
];

export default function InformacoesPage() {
  const { getCompany, updateCompanyData } = useAuth();
  const company = getCompany();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [formData, setFormData] = useState<Company | null>(
    company
      ? {
          ...company,
          name: company.name || "",
          description: company.description || "",
          instagram: company.instagram || "",
          facebook: company.facebook || "",
          segment: company.segment || "",
          whatsapp: company.whatsapp || "",
          minimumOrder: company.minimumOrder || 0,
          averagePreparationTime: company.averagePreparationTime || 40,
          profileImage: company.profileImage || "",
          bannerImage: company.bannerImage || "",
          address: {
            cep: company.address?.cep || "",
            street: company.address?.street || "",
            number: company.address?.number || "",
            neighborhood: company.address?.neighborhood || "",
            city: company.address?.city || "",
            state: company.address?.state || "",
          },
          phone: Array.isArray(company.phone) ? company.phone : [],
          paymentMethods: Array.isArray(company.paymentMethods)
            ? company.paymentMethods
            : [],
          businessHours:
            Array.isArray(company.businessHours) &&
            company.businessHours.length > 0
              ? company.businessHours
              : defaultBusinessHours,
          pizzaBorders: Array.isArray(company.pizzaBorders)
            ? company.pizzaBorders
            : [],
        }
      : null,
  );

  useEffect(() => {
    async function refreshData() {
      if (company?.id) {
        try {
          const freshCompany = await getCompanyById(company.id);
          if (freshCompany) {
            const typedCompany = freshCompany as unknown as Company;
            updateCompanyData(typedCompany);
            setFormData({
              ...typedCompany,
              name: typedCompany.name || "",
              description: typedCompany.description || "",
              instagram: typedCompany.instagram || "",
              facebook: typedCompany.facebook || "",
              segment: typedCompany.segment || "",
              whatsapp: typedCompany.whatsapp || "",
              minimumOrder: typedCompany.minimumOrder || 0,
              averagePreparationTime: typedCompany.averagePreparationTime || 40,
              profileImage: typedCompany.profileImage || "",
              bannerImage: typedCompany.bannerImage || "",
              address: {
                cep: typedCompany.address?.cep || "",
                street: typedCompany.address?.street || "",
                number: typedCompany.address?.number || "",
                neighborhood: typedCompany.address?.neighborhood || "",
                city: typedCompany.address?.city || "",
                state: typedCompany.address?.state || "",
              },
              phone: Array.isArray(typedCompany.phone)
                ? typedCompany.phone
                : [],
              paymentMethods: Array.isArray(typedCompany.paymentMethods)
                ? typedCompany.paymentMethods
                : [],
              businessHours:
                Array.isArray(typedCompany.businessHours) &&
                typedCompany.businessHours.length > 0
                  ? typedCompany.businessHours
                  : defaultBusinessHours,
              pizzaBorders: Array.isArray(typedCompany.pizzaBorders)
                ? typedCompany.pizzaBorders
                : [],
            });
          }
        } catch (error) {
          console.error("Failed to refresh company data:", error);
        }
      }
    }

    refreshData();
  }, [company?.id, updateCompanyData]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Crop state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropField, setCropField] = useState<
    "profileImage" | "bannerImage" | null
  >(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  if (!company) {
    console.log("Empresa não encontrada no InformacoesPage");
    return (
      <div className="p-4">
        Empresa não encontrada no contexto de autenticação.
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profileImage" | "bannerImage",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImage(reader.result as string);
        setCropField(field);
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels || !cropField) return;

    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(
        cropImage,
        croppedAreaPixels,
      );

      const file = new File([croppedImageBlob], "cropped-image.jpg", {
        type: "image/jpeg",
      });

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Falha no upload");

      const data = await response.json();

      // Update form data
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              [cropField]: data.url,
            }
          : null,
      );

      // Save to backend immediately
      if (company?.id) {
        const updateResult = await updateCompany(company.id, {
          [cropField]: data.url,
        });

        if (updateResult.success && updateResult.company) {
          updateCompanyData(updateResult.company as unknown as Company);
          setMessage({
            type: "success",
            text: "Imagem salva com sucesso!",
          });
        } else {
          setMessage({
            type: "error",
            text: "Imagem enviada, mas houve um erro ao salvar no perfil.",
          });
        }
      }

      setIsCropping(false);
      setCropImage(null);
      setCropField(null);
    } catch (error) {
      console.error("Erro no upload:", error);
      setMessage({ type: "error", text: "Erro ao fazer upload da imagem." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setCropImage(null);
    setCropField(null);
  };

  // Mantendo a função antiga para compatibilidade se necessário, mas redirecionando para o novo fluxo
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profileImage" | "bannerImage",
  ) => {
    handleImageSelect(e, field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (!company?.id) throw new Error("ID da empresa não encontrado");

      const dataToSave = {
        ...formData!,
        phone: formData!.phone.filter((p) => p.trim() !== ""),
      };

      const result = await updateCompany(company.id, {
        segment: formData!.segment,
        ...dataToSave,
      });

      if (result.success && result.company) {
        updateCompanyData(result.company as unknown as Company);
        setMessage({
          type: "success",
          text: "Informações salvas com sucesso!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Erro ao salvar informações.",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Erro ao salvar informações." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDialogSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
    setActiveDialog(null);
  };

  const updateAddress = (field: keyof Company["address"], value: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            address: {
              ...prev.address,
              [field]: value,
            },
          }
        : null,
    );
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanedCep}/json/`,
      );
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) =>
          prev
            ? {
                ...prev,
                address: {
                  ...prev.address,
                  street: data.logradouro || prev.address.street,
                  neighborhood: data.bairro || prev.address.neighborhood,
                  city: data.localidade || prev.address.city,
                  state: data.uf || prev.address.state,
                },
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const updateBusinessHours = (
    index: number,
    field: keyof BusinessHours,
    value: any,
  ) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newHours = [...prev.businessHours];
      newHours[index] = { ...newHours[index], [field]: value };
      return { ...prev, businessHours: newHours };
    });
  };

  const updatePhone = (index: number, value: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPhones = [...prev.phone];
      newPhones[index] = formatPhone(value);
      return { ...prev, phone: newPhones };
    });
  };

  const removePhone = (index: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const newPhones = prev.phone.filter((_, i) => i !== index);
      return { ...prev, phone: newPhones };
    });
  };

  const addPhone = () => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            phone: [...prev.phone, ""],
          }
        : null,
    );
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setFormData((prev) => {
      if (!prev) return null;
      const methods = [...prev.paymentMethods];
      const index = methods.indexOf(method);
      if (index > -1) {
        methods.splice(index, 1);
      } else {
        methods.push(method);
      }
      return { ...prev, paymentMethods: methods };
    });
  };

  const menuSections = [
    {
      title: "Minha Empresa",
      items: [
        {
          id: "dados",
          icon: Building2,
          title: "Dados da Empresa",
          description: "Nome do estabelecimento e descrição",
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Empresa</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background resize-none"
                />
              </div>
            </div>
          ),
        },
        {
          id: "segmento",
          icon: LayoutGrid,
          title: "Segmento",
          description:
            formData.segment || "Selecione o segmento do seu estabelecimento",
          content: (
            <div className="py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {segments.map((s) => {
                  const Icon = s.icon;
                  const isSelected = formData.segment === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) =>
                          prev ? { ...prev, segment: s.id } : null,
                        )
                      }
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-secondary bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center">
                        {s.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        },
        {
          id: "endereco",
          icon: MapPin,
          title: "Endereço",
          description: `${formData.address.street}, ${formData.address.number}, ${formData.address.neighborhood}`,
          content: (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CEP</label>
                  <input
                    type="text"
                    value={formData.address.cep}
                    onChange={(e) => updateAddress("cep", e.target.value)}
                    onBlur={(e) => fetchAddressByCep(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Rua</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => updateAddress("street", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número</label>
                  <input
                    type="text"
                    value={formData.address.number}
                    onChange={(e) => updateAddress("number", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro</label>
                  <input
                    type="text"
                    value={formData.address.neighborhood}
                    onChange={(e) =>
                      updateAddress("neighborhood", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => updateAddress("city", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "horarios",
          icon: Clock,
          title: "Horários de Funcionamento",
          description: "Defina os horários de abertura e fechamento",
          content: (
            <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {formData.businessHours?.map((day, index) => (
                <div
                  key={day.dayOfWeek}
                  className="flex flex-wrap items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <label className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) =>
                        updateBusinessHours(index, "isOpen", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="font-medium">{day.dayName}</span>
                  </label>

                  {day.isOpen && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) =>
                          updateBusinessHours(index, "openTime", e.target.value)
                        }
                        className="px-2 py-1 rounded border bg-background text-sm"
                      />
                      <span>até</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) =>
                          updateBusinessHours(
                            index,
                            "closeTime",
                            e.target.value,
                          )
                        }
                        className="px-2 py-1 rounded border bg-background text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "telefones",
          icon: Smartphone,
          title: "Telefones de Contato",
          description: `${formData.phone.length} telefone(s) cadastrado(s)`,
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                {formData.phone.map((p, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => updatePhone(index, e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => removePhone(index)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={addPhone}
              >
                <Plus className="h-4 w-4" />
                Adicionar Telefone
              </Button>
            </div>
          ),
        },
      ],
    },
    {
      title: "Configurações",
      items: [
        {
          id: "entrega",
          icon: Settings,
          title: "Valor Mínimo e Entrega",
          description: "Valor mínimo, entrega e retirada",
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor Mínimo do Pedido (R$)
                </label>
                <input
                  type="number"
                  value={formData.minimumOrder}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            minimumOrder: parseFloat(e.target.value) || 0,
                          }
                        : null,
                    )
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tempo Médio de Preparo (minutos)
                </label>
                <input
                  type="number"
                  value={formData.averagePreparationTime || 40}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            averagePreparationTime:
                              parseInt(e.target.value) || 0,
                          }
                        : null,
                    )
                  }
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                />
              </div>
            </div>
          ),
        },
        {
          id: "aparencia",
          icon: Palette,
          title: "Aparência",
          description: "Foto de perfil e banner da loja",
          content: (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <label className="text-sm font-medium">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-border overflow-hidden bg-secondary">
                    {formData.profileImage ? (
                      <Image
                        src={formData.profileImage}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    Alterar foto
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium">Banner da Loja</label>
                <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-border overflow-hidden bg-secondary">
                  {formData.bannerImage ? (
                    <Image
                      src={formData.bannerImage}
                      alt="Banner"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => bannerImageInputRef.current?.click()}
                >
                  Alterar banner
                </Button>
              </div>
              <input
                type="file"
                ref={profileImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "profileImage")}
              />
              <input
                type="file"
                ref={bannerImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "bannerImage")}
              />
            </div>
          ),
        },
        {
          id: "pagamento",
          icon: CreditCard,
          title: "Formas de Pagamento",
          description: "Formas de pagamento aceitas",
          content: (
            <div className="space-y-3 py-4">
              {Object.entries(paymentMethodLabels).map(([key, label]) => {
                const method = key as PaymentMethod;
                const isSelected = formData.paymentMethods.includes(method);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePaymentMethod(method)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                    {isSelected ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border" />
                    )}
                  </button>
                );
              })}
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as informações e preferências da sua loja
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Menu Sections */}
      <div className="space-y-8">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-lg font-bold px-1">{section.title}</h2>
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveDialog(item.id)}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left ${
                    index !== section.items.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="p-2.5 bg-secondary rounded-xl text-muted-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialogs */}
      {menuSections
        .flatMap((s) => s.items)
        .map((item) => (
          <Dialog
            key={item.id}
            open={activeDialog === item.id}
            onOpenChange={(open) => !open && setActiveDialog(null)}
          >
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleDialogSave}>
                <DialogHeader>
                  <DialogTitle>{item.title}</DialogTitle>
                  <DialogDescription>
                    Altere as informações abaixo e clique em salvar.
                  </DialogDescription>
                </DialogHeader>

                {item.content}

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveDialog(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ))}

      {/* Crop Dialog (Existing) */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full bg-secondary rounded-lg overflow-hidden">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={cropField === "profileImage" ? 1 : 3 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={([value]) => setZoom(value)}
              />
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCropCancel}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCropSave} disabled={isUploading}>
              {isUploading ? "Salvando..." : "Salvar Foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
