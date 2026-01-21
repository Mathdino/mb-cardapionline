"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  CartItem,
  Product,
  ProductFlavor,
  SelectedComboItem,
} from "./types";
import { formatCurrency } from "./mock-data";

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (
    product: Product,
    quantity: number,
    selectedFlavor?: ProductFlavor,
    selectedComboItems?: SelectedComboItem[],
    removedIngredients?: string[],
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getWhatsAppMessage: (
    companyWhatsapp: string,
    customerName: string,
    paymentMethod: string,
    notes?: string,
  ) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(
    (
      product: Product,
      quantity: number,
      selectedFlavor?: ProductFlavor,
      selectedComboItems?: SelectedComboItem[],
      removedIngredients?: string[],
    ) => {
      setItems((prev) => {
        // Simple check for existing item - for combos/flavors this might need to be more strict
        // Currently treating each combo configuration as unique if it has combo items
        const existingIndex = prev.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedFlavor?.id === selectedFlavor?.id &&
            // If it has combo items, we always add as new item for simplicity unless deep comparison
            !item.selectedComboItems &&
            !selectedComboItems &&
            (!item.removedIngredients ||
              item.removedIngredients.length === 0) &&
            (!removedIngredients || removedIngredients.length === 0),
        );

        let unitPrice =
          product.isPromotion && product.promotionalPrice
            ? product.promotionalPrice
            : product.price;

        if (selectedFlavor) {
          unitPrice += selectedFlavor.priceModifier;
        }

        if (selectedComboItems) {
          selectedComboItems.forEach((comboItem) => {
            unitPrice += comboItem.priceModifier * comboItem.quantity;
          });
        }

        const subtotal = unitPrice * quantity;

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity += quantity;
          updated[existingIndex].subtotal =
            updated[existingIndex].quantity * unitPrice;
          return updated;
        }

        return [
          ...prev,
          {
            cartItemId: crypto.randomUUID(),
            product,
            quantity,
            selectedFlavor,
            selectedComboItems,
            removedIngredients,
            subtotal,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId === cartItemId) {
            let unitPrice =
              item.product.isPromotion && item.product.promotionalPrice
                ? item.product.promotionalPrice
                : item.product.price;

            if (item.selectedFlavor) {
              unitPrice += item.selectedFlavor.priceModifier;
            }

            if (item.selectedComboItems) {
              item.selectedComboItems.forEach((comboItem) => {
                unitPrice += comboItem.priceModifier * comboItem.quantity;
              });
            }

            return {
              ...item,
              quantity,
              subtotal: quantity * unitPrice,
            };
          }
          return item;
        }),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getWhatsAppMessage = useCallback(
    (
      companyWhatsapp: string,
      customerName: string,
      paymentMethod: string,
      notes?: string,
    ) => {
      let message = `*Novo Pedido*\n\n`;
      message += `*Cliente:* ${customerName}\n\n`;
      message += `*Itens do Pedido:*\n`;

      items.forEach((item) => {
        const hasPromotion =
          item.product.isPromotion &&
          item.product.promotionalPrice !== null &&
          item.product.promotionalPrice !== undefined &&
          item.product.promotionalPrice > 0;

        const price = hasPromotion
          ? item.product.promotionalPrice!
          : item.product.price;

        message += `- ${item.quantity}x ${item.product.name}`;
        if (item.selectedFlavor) {
          message += ` (${item.selectedFlavor.name})`;
        }

        if (item.removedIngredients && item.removedIngredients.length > 0) {
          message += `\n  *Sem:* ${item.removedIngredients.join(", ")}`;
        }

        if (item.selectedComboItems && item.selectedComboItems.length > 0) {
          message += `\n  *Itens do Combo:*`;
          item.selectedComboItems.forEach((comboItem) => {
            message += `\n  - ${comboItem.quantity}x ${comboItem.name}`;
          });
        }

        message += ` - ${formatCurrency(item.subtotal)}\n`;
      });

      message += `\n*Total:* ${formatCurrency(total)}\n`;
      message += `*Forma de Pagamento:* ${paymentMethod}\n`;

      if (notes) {
        message += `*Observações:* ${notes}\n`;
      }

      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${companyWhatsapp}?text=${encodedMessage}`;
    },
    [items, total],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getWhatsAppMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
