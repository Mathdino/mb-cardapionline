"use client";

import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TicketPercent,
  User,
  Phone,
  Truck,
  Store,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import {
  formatCurrency,
  paymentMethodLabels,
  formatPhone,
  formatCPF,
  formatCEP,
} from "@/lib/utils";
import type { Company, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createOrder } from "@/app/actions/order";
import { OrderItem } from "@/lib/types";
import { useSession } from "next-auth/react";

import { useAuth } from "@/lib/auth-context";

interface CartSheetProps {
  company: Company;
}

export function CartSheet({ company }: CartSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  });
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    company.allowsDelivery ? "delivery" : "pickup",
  );
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const { data: session } = useSession();
  const { user: authUser } = useAuth();

  const {
    items,
    total,
    subtotal,
    discount,
    coupon,
    itemCount,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const promoDiscount = useMemo(() => {
    let d = 0;
    items.forEach((item) => {
      const hasPromotion =
        item.product.isPromotion &&
        item.product.promotionalPrice !== null &&
        item.product.promotionalPrice !== undefined &&
        item.product.promotionalPrice > 0;
      if (hasPromotion) {
        const diff = item.product.price - item.product.promotionalPrice!;
        if (diff > 0) d += diff * item.quantity;
      }
    });
    return d;
  }, [items]);

  useEffect(() => {
    if (session?.user && !hasPrefilled) {
      setCustomerName(session.user.name || "");
      if (session.user.phone) {
        setCustomerPhone(formatPhone(session.user.phone));
      }
      if (session.user.cpf) {
        setCustomerCpf(formatCPF(session.user.cpf));
      }
      if (session.user.address) {
        setDeliveryAddress({
          street: session.user.address.street || "",
          number: session.user.address.number || "",
          complement: session.user.address.complement || "",
          neighborhood: session.user.address.neighborhood || "",
          city: session.user.address.city || "",
          state: session.user.address.state || "",
          cep: session.user.address.cep || "",
        });
      }
      setHasPrefilled(true);
    } else if (authUser && !hasPrefilled) {
      setCustomerName(authUser.name || "");
      if (authUser.phone) {
        setCustomerPhone(formatPhone(authUser.phone));
      }
      if (authUser.cpf) {
        setCustomerCpf(formatCPF(authUser.cpf));
      }
      if (authUser.address) {
        setDeliveryAddress({
          street: authUser.address.street || "",
          number: authUser.address.number || "",
          complement: authUser.address.complement || "",
          neighborhood: authUser.address.neighborhood || "",
          city: authUser.address.city || "",
          state: authUser.address.state || "",
          cep: authUser.address.cep || "",
        });
      }
      setHasPrefilled(true);
    }
  }, [session, authUser, hasPrefilled]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const result = await applyCoupon(couponCode, company.id);
      if (!result.success) {
        alert(result.message || "Erro ao aplicar cupom");
      } else {
        setCouponCode("");
        setShowCouponModal(false);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao validar cupom");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!company.isOpen) {
      alert("O restaurante está fechado no momento.");
      return;
    }

    if (!customerName.trim()) {
      alert("Por favor, informe seu nome");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Por favor, informe seu telefone");
      return;
    }

    if (
      deliveryType === "delivery" &&
      (!deliveryAddress.street || !deliveryAddress.number)
    ) {
      alert("Por favor, informe o endereço de entrega (Rua e Número).");
      return;
    }

    if (total < company.minimumOrder) {
      alert(`O pedido mínimo é ${formatCurrency(company.minimumOrder)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order items
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.subtotal / item.quantity,
        subtotal: item.subtotal,
        selectedFlavor: item.selectedFlavor?.name,
        selectedFlavors: item.selectedFlavors?.map((f) => f.name),
        comboItems: item.selectedComboItems?.map(
          (ci) => `${ci.quantity}x ${ci.name}`,
        ),
        selectedComplements: item.selectedComplements,
        removedIngredients: item.removedIngredients,
        selectedPizzaBorder: item.selectedPizzaBorder?.name,
      }));

      // Create order in database
      const result = await createOrder({
        companyId: company.id,
        customerName,
        customerPhone,
        customerCpf,
        deliveryAddress,
        items: orderItems,
        total,
        paymentMethod,
        notes,
        userId: session?.user?.id || authUser?.id,
        couponId: coupon?.id,
        discount,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      // Open WhatsApp
      let message = `*Novo Pedido* - ${company.name}\n\n`;
      message += `*Cliente:* ${customerName}\n`;
      message += `*Telefone:* ${customerPhone}\n`;
      if (customerCpf) message += `*CPF:* ${customerCpf}\n`;
      if (deliveryType === "delivery") {
        message += `*Endereço:* ${deliveryAddress.street}, ${deliveryAddress.number}${
          deliveryAddress.complement ? `, ${deliveryAddress.complement}` : ""
        } - ${deliveryAddress.neighborhood}\n\n`;
      } else {
        message += `*Tipo:* Retirada no Local\n\n`;
      }

      message += `*Itens:*\n`;
      orderItems.forEach((item) => {
        message += `${item.quantity}x ${item.productName}`;
        if (item.selectedFlavor) message += ` (${item.selectedFlavor})`;
        if (item.selectedFlavors)
          message += ` (${item.selectedFlavors.join(", ")})`;
        if (item.selectedPizzaBorder)
          message += ` (Borda: ${item.selectedPizzaBorder})`;
        message += ` - ${formatCurrency(item.subtotal)}\n`;
        if (item.comboItems && item.comboItems.length > 0) {
          item.comboItems.forEach((ci) => (message += `  - ${ci}\n`));
        }
        if (item.selectedComplements && item.selectedComplements.length > 0) {
          item.selectedComplements.forEach(
            (comp) => (message += `  - + ${comp.quantity}x ${comp.name}\n`),
          );
        }
        if (item.removedIngredients && item.removedIngredients.length > 0) {
          message += `  - Sem: ${item.removedIngredients.join(", ")}\n`;
        }
      });

      if (coupon) {
        message += `\n*Cupom:* ${coupon.code}`;
        message += `\n*Desconto:* -${formatCurrency(discount)}`;
      }

      message += `\n*Total:* ${formatCurrency(total)}\n`;
      message += `*Pagamento:* ${paymentMethodLabels[paymentMethod]}\n`;
      if (notes) message += `*Obs:* ${notes}\n`;

      const digits = (
        company.whatsapp ||
        (Array.isArray(company.phone) ? company.phone[0] : "") ||
        ""
      ).replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
        message,
      )}`;

      window.open(whatsappUrl, "_blank");

      if (session?.user) {
        router.push("/historico");
      }

      clearCart();
      setIsOpen(false);
      setShowCheckout(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerCpf("");
      setDeliveryAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
      });
      setNotes("");
    } catch (error) {
      console.error("Error processing order:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao processar pedido. Por favor, tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Cart Button */}
      {itemCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Ver carrinho</span>
          <span className="bg-primary-foreground text-primary px-2 py-0.5 rounded-full text-sm font-bold">
            {itemCount}
          </span>
        </button>
      )}

      {/* Cart Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false);
              setShowCheckout(false);
            }}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-foreground">
                {showCheckout ? "Finalizar Pedido" : "Seu Carrinho"}
              </h2>
              <button
                onClick={() => {
                  if (showCheckout) {
                    setShowCheckout(false);
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!showCheckout ? (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={item.cartItemId}
                          className="flex gap-3 p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <Image
                              src={item.product.image || "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {item.product.name}
                            </h4>
                            {item.selectedFlavors &&
                            item.selectedFlavors.length > 0 ? (
                              <p className="text-xs text-muted-foreground">
                                {item.selectedFlavors
                                  .map((f) => f.name)
                                  .join(", ")}
                              </p>
                            ) : (
                              item.selectedFlavor && (
                                <p className="text-xs text-muted-foreground">
                                  {item.selectedFlavor.name}
                                </p>
                              )
                            )}
                            {item.removedIngredients &&
                              item.removedIngredients.length > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                  Sem: {item.removedIngredients.join(", ")}
                                </p>
                              )}
                            {item.selectedComboItems &&
                              item.selectedComboItems.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedComboItems.map(
                                    (comboItem, i) => (
                                      <p
                                        key={i}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {comboItem.quantity}x {comboItem.name}
                                      </p>
                                    ),
                                  )}
                                </div>
                              )}
                            {item.selectedComplements &&
                              item.selectedComplements.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedComplements.map((comp, i) => (
                                    <p
                                      key={i}
                                      className="text-xs text-muted-foreground"
                                    >
                                      + {comp.quantity}x {comp.name}
                                    </p>
                                  ))}
                                </div>
                              )}
                            {item.selectedPizzaBorder && (
                              <p className="text-xs text-muted-foreground font-medium mt-1">
                                Borda: {item.selectedPizzaBorder.name}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-foreground mt-1">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-between">
                            <button
                              onClick={() => removeItem(item.cartItemId)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity - 1,
                                  )
                                }
                                className="p-1 rounded bg-secondary hover:bg-secondary/80"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity + 1,
                                  )
                                }
                                className="p-1 rounded bg-secondary hover:bg-secondary/80"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="p-4 border-t bg-background">
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {coupon && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span>Desconto</span>
                          <span>- {formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <span className="text-base font-bold text-foreground">
                          Total
                        </span>
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    {total < company.minimumOrder && (
                      <p className="text-sm text-destructive mb-3">
                        Pedido mínimo: {formatCurrency(company.minimumOrder)}
                      </p>
                    )}

                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setShowCheckout(true);
                      }}
                      disabled={total < company.minimumOrder}
                      className="w-full h-12"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b">
              <button
                className="p-2 rounded-full hover:bg-secondary"
                onClick={() => setShowCheckout(false)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold">Finalizar compra</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className="text-[18px] font-extrabold font-serif">
                  Dados do cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Seu nome"
                      className="flex-1 px-4 py-3 rounded-lg border"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(formatPhone(e.target.value))
                      }
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                      className="flex-1 px-4 py-3 rounded-lg border"
                    />
                  </div>
                </div>
              </div>
              {company.allowsDelivery && company.allowsPickup && (
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-[18px] font-extrabold font-serif">
                      Metódo de Entrega
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${
                        deliveryType === "delivery"
                          ? "border-brand bg-brand/15 text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                      <span className="font-bold text-sm">Entrega</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${
                        deliveryType === "pickup"
                          ? "border-brand bg-brand/15 text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      <Store className="h-5 w-5" />
                      <span className="font-bold text-sm">Retirada</span>
                    </button>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-[18px] font-extrabold font-serif">
                    Endereço de entrega
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressDialog(true)}
                  className="w-full flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium">
                      {deliveryAddress.street && deliveryAddress.number
                        ? `${deliveryAddress.street}, ${deliveryAddress.number}${
                            deliveryAddress.complement
                              ? `, ${deliveryAddress.complement}`
                              : ""
                          }${
                            deliveryAddress.neighborhood
                              ? ` - ${deliveryAddress.neighborhood}`
                              : ""
                          }`
                        : "Definir endereço"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Toque para editar
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-extrabold font-serif">
                    Pagamento
                  </h3>
                  <button
                    className="text-sm text-primary"
                    onClick={() => setShowAllPayments((v) => !v)}
                  >
                    {showAllPayments ? "Ocultar" : "Ver tudo"}
                  </button>
                </div>
                {!showAllPayments ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {paymentMethodLabels[paymentMethod]}
                    </span>
                    <div className="h-5 w-5 rounded-full border-2 border-brand flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(Array.isArray(company.paymentMethods)
                      ? company.paymentMethods
                      : []
                    ).map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method as PaymentMethod);
                          setShowAllPayments(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          paymentMethod === method
                            ? "border-brand bg-brand/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-foreground">
                          {paymentMethodLabels[method]}
                        </span>
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === method
                              ? "border-brand"
                              : "border-muted-foreground"
                          }`}
                        >
                          {paymentMethod === method && (
                            <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className="text-[18px] font-extrabold font-serif">
                  Resumo do pedido
                </h3>
                {items.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-secondary">
                      <Image
                        src={items[0].product.image || "/placeholder.svg"}
                        alt={items[0].product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        {items.length === 1
                          ? "1 item"
                          : `${items.length} itens`}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {item.quantity}x {item.product.name}
                        </div>
                        {item.selectedFlavors &&
                        item.selectedFlavors.length > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            Sabores:{" "}
                            {item.selectedFlavors.map((f) => f.name).join(", ")}
                          </div>
                        ) : (
                          item.selectedFlavor && (
                            <div className="text-xs text-muted-foreground">
                              Sabor: {item.selectedFlavor.name}
                            </div>
                          )
                        )}
                        {item.selectedPizzaBorder && (
                          <div className="text-xs text-muted-foreground">
                            Borda: {item.selectedPizzaBorder.name}
                          </div>
                        )}
                        {item.selectedComboItems &&
                          item.selectedComboItems.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {item.selectedComboItems.map((comboItem, i) => (
                                <span key={i}>
                                  {i > 0 ? " • " : ""}
                                  {comboItem.quantity}x {comboItem.name}
                                </span>
                              ))}
                            </div>
                          )}
                        {item.selectedComplements &&
                          item.selectedComplements.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {item.selectedComplements.map((comp, i) => (
                                <span key={i}>
                                  {i > 0 ? " • " : ""}+ {comp.quantity}x{" "}
                                  {comp.name}
                                </span>
                              ))}
                            </div>
                          )}
                        {item.removedIngredients &&
                          item.removedIngredients.length > 0 && (
                            <div className="text-xs text-red-500">
                              Sem: {item.removedIngredients.join(", ")}
                            </div>
                          )}
                      </div>
                      <div className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className="text-[18px] font-extrabold font-serif">
                  Economize hoje
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="w-full flex items-center justify-between rounded-2xl bg-emerald-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500 text-white">
                      <TicketPercent className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-700">
                        Adicione um cupom
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-700" />
                </button>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Promoções do cardápio</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}
                  {coupon && (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Cupom aplicado</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Taxa de entrega
                    </span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-base font-bold text-foreground">
                      Total
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className="text-[18px] font-extrabold font-serif">CPF</h3>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-3 rounded-lg border"
                />
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className="text-[18px] font-extrabold font-serif">
                  Informações adicionais
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border resize-none"
                />
              </div>
              <div className="px-1 text-xs text-muted-foreground">
                Este pedido é entregue pela loja. Ao tocar no botão de "pedir",
                você concorda em fornecer seu nome, endereço e número de
                telefone à loja para entrega.
              </div>
            </div>
            <div className="p-4 border-t bg-background">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xl font-bold">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-xs text-green-600">
                    {promoDiscount + discount > 0
                      ? `Economizou ${formatCurrency(promoDiscount + discount)}`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={
                    !customerName.trim() ||
                    !customerPhone.trim() ||
                    isSubmitting
                  }
                  className="h-12 px-6 rounded-lg bg-brand text-white font-bold"
                >
                  {isSubmitting ? "Processando..." : "Pedir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Endereço de Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={deliveryAddress.cep}
                  onChange={(e) => {
                    const newCep = formatCEP(e.target.value);
                    setDeliveryAddress({
                      ...deliveryAddress,
                      cep: newCep,
                    });
                    if (newCep.length === 9) {
                      fetch(
                        `https://viacep.com.br/ws/${newCep.replace(/\D/g, "")}/json/`,
                      )
                        .then((res) => res.json())
                        .then((data) => {
                          if (!data.erro) {
                            setDeliveryAddress((prev) => ({
                              ...prev,
                              street: data.logradouro,
                              neighborhood: data.bairro,
                              city: data.localidade,
                              state: data.uf,
                              cep: newCep,
                            }));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rua
              </label>
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    street: e.target.value,
                  })
                }
                placeholder="Nome da rua"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={deliveryAddress.neighborhood}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      neighborhood: e.target.value,
                    })
                  }
                  placeholder="Bairro"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nº
                </label>
                <input
                  type="text"
                  value={deliveryAddress.number}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      number: e.target.value,
                    })
                  }
                  placeholder="123"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={deliveryAddress.complement}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      complement: e.target.value,
                    })
                  }
                  placeholder="Apto, Bloco, Referência"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      city: e.target.value,
                    })
                  }
                  placeholder="Cidade"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  UF
                </label>
                <input
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      state: e.target.value,
                    })
                  }
                  placeholder="UF"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAddressDialog(false)}
              className="w-full"
            >
              Confirmar Endereço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cupom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              className="w-full px-4 py-3 rounded-lg border"
            />
            {coupon && (
              <div className="text-sm text-emerald-700">
                Cupom aplicado: {coupon.code} (-{formatCurrency(discount)})
              </div>
            )}
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCode.trim()}
            >
              {isApplyingCoupon ? "Aplicando..." : "Aplicar cupom"}
            </Button>
            {coupon && (
              <Button
                variant="secondary"
                onClick={() => {
                  removeCoupon();
                  setShowCouponModal(false);
                }}
              >
                Remover cupom
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
