"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product, ProductFlavor, SelectedComboItem } from "@/lib/types";
import { formatCurrency, mockProducts } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState<ProductFlavor | null>(
    null,
  );
  const [comboSelections, setComboSelections] = useState<
    Record<string, number>
  >({});
  const { addItem } = useCart();

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedFlavor(product.flavors?.[0] || null);
      setComboSelections({});
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const getUnitPrice = () => {
    let price =
      product.isPromotion && product.promotionalPrice
        ? product.promotionalPrice
        : product.price;

    if (selectedFlavor) {
      price += selectedFlavor.priceModifier;
    }

    if (product.productType === "combo" && product.comboConfig) {
      Object.entries(comboSelections).forEach(([id, qty]) => {
        const option = product.comboConfig!.options.find(
          (opt) => opt.id === id,
        );
        if (option) {
          price += option.priceModifier * qty;
        }
      });
    }

    return price;
  };

  const getTotalPrice = () => getUnitPrice() * quantity;

  const getComboTotalSelected = () => {
    return Object.values(comboSelections).reduce((sum, qty) => sum + qty, 0);
  };

  const handleAddToCart = () => {
    let selectedComboItems: SelectedComboItem[] | undefined;

    if (product.productType === "combo" && product.comboConfig) {
      selectedComboItems = Object.entries(comboSelections).map(
        ([id, quantity]) => {
          const option = product.comboConfig!.options.find(
            (opt) => opt.id === id,
          );
          if (!option) throw new Error(`Combo option ${id} not found`);
          return {
            ...option,
            quantity,
          };
        },
      );
    }

    addItem(product, quantity, selectedFlavor || undefined, selectedComboItems);
    onClose();
  };

  const canAddToCart = () => {
    if (product.productType === "flavors" && !selectedFlavor) return false;
    if (product.productType === "combo" && product.comboConfig) {
      return getComboTotalSelected() === product.comboConfig.maxItems;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with Image */}
      <div className="relative h-64 w-full flex-shrink-0">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {product.isPromotion && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Promoção
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Title & Description */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
          <p className="text-muted-foreground mt-2">{product.description}</p>

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            {product.isPromotion && product.promotionalPrice ? (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(product.promotionalPrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-foreground">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Flavors Selection */}
        {product.productType === "flavors" && product.flavors && (
          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-3">
              Escolha o sabor
            </h3>
            <div className="space-y-2">
              {product.flavors.map((flavor) => (
                <button
                  key={flavor.id}
                  onClick={() => setSelectedFlavor(flavor)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedFlavor?.id === flavor.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{flavor.name}</p>
                    {flavor.description && (
                      <p className="text-sm text-muted-foreground">
                        {flavor.description}
                      </p>
                    )}
                  </div>
                  {flavor.priceModifier !== 0 && (
                    <span
                      className={`text-sm font-medium ${flavor.priceModifier > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {flavor.priceModifier > 0 ? "+" : ""}
                      {formatCurrency(flavor.priceModifier)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Combo Options */}
        {product.productType === "combo" && product.comboConfig && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">
                Escolha os itens
              </h3>
              <span className="text-sm text-muted-foreground">
                {getComboTotalSelected()}/{product.comboConfig.maxItems}{" "}
                selecionados
              </span>
            </div>
            <div className="space-y-4">
              {product.comboConfig.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <span className="font-medium text-foreground">
                      {option.name}
                    </span>
                    {option.priceModifier > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        + {formatCurrency(option.priceModifier)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setComboSelections((prev) => {
                          const current = prev[option.id] || 0;
                          if (current <= 0) return prev;
                          const next = { ...prev, [option.id]: current - 1 };
                          if (next[option.id] === 0) delete next[option.id];
                          return next;
                        });
                      }}
                      disabled={!comboSelections[option.id]}
                      className="p-1 rounded-full hover:bg-secondary disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-4 text-center">
                      {comboSelections[option.id] || 0}
                    </span>
                    <button
                      onClick={() => {
                        setComboSelections((prev) => ({
                          ...prev,
                          [option.id]: (prev[option.id] || 0) + 1,
                        }));
                      }}
                      disabled={
                        getComboTotalSelected() >=
                        (product.comboConfig?.maxItems || 0)
                      }
                      className="p-1 rounded-full hover:bg-secondary disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Add to Cart */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex items-center justify-between mb-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-8 text-center font-semibold text-lg">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Total */}
          <span className="text-xl font-bold text-foreground">
            {formatCurrency(getTotalPrice())}
          </span>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart()}
          className="w-full h-12 text-lg"
        >
          Adicionar ao carrinho
        </Button>
      </div>
    </div>
  );
}
