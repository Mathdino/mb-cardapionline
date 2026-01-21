"use client";

import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatCurrency, paymentMethodLabels, formatPhone } from "@/lib/utils";
import type { Company, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { createOrder } from "@/app/actions/order";
import { OrderItem } from "@/lib/types";

interface CartSheetProps {
  company: Company;
}

export function CartSheet({ company }: CartSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    items,
    total,
    itemCount,
    removeItem,
    updateQuantity,
    clearCart,
    getWhatsAppMessage,
  } = useCart();

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
        removedIngredients: item.removedIngredients,
      }));

      // Create order in database
      const result = await createOrder({
        companyId: company.id,
        customerName,
        customerPhone,
        items: orderItems,
        total,
        paymentMethod,
        notes,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      // Open WhatsApp
      const whatsappUrl = getWhatsAppMessage(
        company.whatsapp,
        customerName,
        paymentMethodLabels[paymentMethod],
        notes,
      );

      window.open(whatsappUrl, "_blank");
      clearCart();
      setIsOpen(false);
      setShowCheckout(false);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Erro ao processar pedido. Por favor, tente novamente.");
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
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    {total < company.minimumOrder && (
                      <p className="text-sm text-destructive mb-3">
                        Pedido mínimo: {formatCurrency(company.minimumOrder)}
                      </p>
                    )}

                    <Button
                      onClick={() => setShowCheckout(true)}
                      disabled={total < company.minimumOrder}
                      className="w-full h-12"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Checkout Form */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Seu nome
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Seu telefone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(formatPhone(e.target.value))
                      }
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Observações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Tirar a cebola, troco para 50..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Forma de pagamento
                    </label>
                    <div className="space-y-2">
                      {company.paymentMethods.map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            paymentMethod === method
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="font-medium text-foreground">
                            {paymentMethodLabels[method]}
                          </span>
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === method
                                ? "border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {paymentMethod === method && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-foreground mb-3">
                      Resumo do pedido
                    </h3>
                    <div className="space-y-2 text-sm">
                      {items.map((item, index) => (
                        <div
                          key={item.cartItemId}
                          className="flex flex-col text-muted-foreground"
                        >
                          <div className="flex justify-between">
                            <span>
                              {item.quantity}x {item.product.name}
                            </span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                          {item.selectedFlavors &&
                          item.selectedFlavors.length > 0 ? (
                            <span className="text-xs pl-4">
                              +{" "}
                              {item.selectedFlavors
                                .map((f) => f.name)
                                .join(", ")}
                            </span>
                          ) : (
                            item.selectedFlavor && (
                              <span className="text-xs pl-4">
                                + {item.selectedFlavor.name}
                              </span>
                            )
                          )}
                          {item.removedIngredients &&
                            item.removedIngredients.length > 0 && (
                              <span className="text-xs pl-4 text-red-500">
                                Sem: {item.removedIngredients.join(", ")}
                              </span>
                            )}
                          {item.selectedComboItems &&
                            item.selectedComboItems.map((comboItem, i) => (
                              <span key={i} className="text-xs pl-4">
                                - {comboItem.quantity}x {comboItem.name}
                              </span>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checkout Footer */}
                <div className="p-4 border-t bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={
                      !customerName.trim() ||
                      !customerPhone.trim() ||
                      isSubmitting
                    }
                    className="w-full h-12 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        Enviar pedido via WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
