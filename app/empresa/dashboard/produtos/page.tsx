"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getCategories } from "@/app/actions/categories";
import {
  getProducts,
  getStoreProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/client/image-cropper";

function ProdutosContent() {
  const searchParams = useSearchParams();
  const { getCompany } = useAuth();
  const company = getCompany();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    promotionalPrice: "",
    isPromotion: false,
    categoryId: "",
    productType: "simple" as "simple" | "flavors" | "combo",
    image: "",
    ingredients: [] as string[],
    flavors: [] as { id: string; name: string; price: string }[],
    minFlavors: "1",
    maxFlavors: "1",
    comboConfig: {
      maxItems: "1",
      options: [] as { id: string; name: string; price: string }[],
      groups: [] as {
        id: string;
        title: string;
        type: "products" | "custom";
        min: string;
        max: string;
        productIds: string[];
        options: { id: string; name: string; price: string }[];
      }[],
    },
  });

  const [newFlavor, setNewFlavor] = useState({ name: "", price: "" });
  const [newComboOption, setNewComboOption] = useState({ name: "", price: "" });
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIngredient.trim()],
    }));
    setNewIngredient("");
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddFlavor = () => {
    if (!newFlavor.name) return;
    setFormData((prev) => ({
      ...prev,
      flavors: [
        ...prev.flavors,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newFlavor.name,
          price: newFlavor.price || "0",
        },
      ],
    }));
    setNewFlavor({ name: "", price: "" });
  };

  const handleRemoveFlavor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      flavors: prev.flavors.filter((f) => f.id !== id),
    }));
  };

  const handleAddComboOption = () => {
    if (!newComboOption.name) return;
    setFormData((prev) => ({
      ...prev,
      comboConfig: {
        ...prev.comboConfig,
        options: [
          ...prev.comboConfig.options,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: newComboOption.name,
            price: newComboOption.price || "0",
          },
        ],
      },
    }));
    setNewComboOption({ name: "", price: "" });
  };

  const handleRemoveComboOption = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      comboConfig: {
        ...prev.comboConfig,
        options: prev.comboConfig.options.filter((o) => o.id !== id),
      },
    }));
  };

  useEffect(() => {
    async function load() {
      if (company?.id) {
        const [productsData, categoriesData] = await Promise.all([
          getStoreProducts(company.id),
          getCategories(company.id),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      }
      setLoading(false);
    }
    load();
  }, [company]);

  if (!company) return null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        promotionalPrice: product.promotionalPrice?.toString() || "",
        isPromotion: product.isPromotion || false,
        categoryId: product.categoryId,
        productType: product.productType as any,
        image: product.image,
        ingredients: product.ingredients || [],
        flavors: Array.isArray(product.flavors)
          ? product.flavors.map((f: any) => ({
              ...f,
              price: f.priceModifier.toString(),
            }))
          : product.flavors?.options
            ? product.flavors.options.map((f: any) => ({
                ...f,
                price: f.priceModifier.toString(),
              }))
            : [],
        minFlavors: product.flavors?.min?.toString() || "1",
        maxFlavors: product.flavors?.max?.toString() || "1",
        comboConfig: product.comboConfig
          ? {
              maxItems: product.comboConfig.maxItems.toString(),
              options: Array.isArray(product.comboConfig.options)
                ? product.comboConfig.options.map((o: any) => ({
                    ...o,
                    price: o.priceModifier.toString(),
                  }))
                : [],
              groups: Array.isArray(product.comboConfig.groups)
                ? product.comboConfig.groups.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    type: g.type,
                    min: g.min.toString(),
                    max: g.max.toString(),
                    productIds: g.productIds || [],
                    options: g.options
                      ? g.options.map((o: any) => ({
                          id: o.id,
                          name: o.name,
                          price: (o.priceModifier || o.price || 0).toString(),
                        }))
                      : [],
                  }))
                : [],
            }
          : { maxItems: "1", options: [], groups: [] },
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        promotionalPrice: "",
        isPromotion: false,
        categoryId: categories[0]?.id || "",
        productType: "simple",
        image: "",
        ingredients: [],
        flavors: [],
        minFlavors: "1",
        maxFlavors: "1",
        comboConfig: { maxItems: "1", options: [], groups: [] },
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Reset input
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", croppedImageBlob, "image.png");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      promotionalPrice: formData.promotionalPrice
        ? parseFloat(formData.promotionalPrice)
        : null,
      isPromotion: formData.isPromotion,
      categoryId: formData.categoryId,
      productType: formData.productType,
      image: formData.image,
      ingredients: formData.ingredients,
      flavors:
        formData.productType === "flavors"
          ? {
              min: parseInt(formData.minFlavors) || 0,
              max: parseInt(formData.maxFlavors) || 0,
              options: formData.flavors.map((f) => ({
                id: f.id,
                name: f.name,
                priceModifier: parseFloat(f.price),
              })),
            }
          : null,
      comboConfig:
        formData.productType === "combo"
          ? {
              maxItems: parseInt(formData.comboConfig.maxItems),
              options: formData.comboConfig.options.map((o) => ({
                id: o.id,
                name: o.name,
                priceModifier: parseFloat(o.price),
              })),
              groups: formData.comboConfig.groups.map((g) => ({
                id: g.id,
                title: g.title,
                type: g.type,
                min: parseInt(g.min) || 0,
                max: parseInt(g.max) || 0,
                productIds: g.productIds || [],
                options:
                  g.options?.map((o) => ({
                    id: o.id,
                    name: o.name,
                    price: parseFloat(o.price) || 0,
                  })) || [],
              })),
            }
          : null,
    };

    try {
      if (editingProduct) {
        const result = await updateProduct(
          editingProduct.id,
          company.id,
          productData,
        );
        if (result.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? result.product : p)),
          );
        }
      } else {
        const result = await createProduct(company.id, productData);
        if (result.success) {
          setProducts((prev) => [...prev, result.product]);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const result = await deleteProduct(productId, company.id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert("Erro ao excluir produto");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o cardápio da sua loja
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-card border rounded-xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-card border rounded-xl overflow-hidden flex flex-col group"
          >
            <div className="relative h-48 bg-secondary">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-colors"
                >
                  <Pencil className="h-4 w-4 text-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-destructive/80 backdrop-blur-sm rounded-lg hover:bg-destructive text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                {getCategoryName(product.categoryId)}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-foreground line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex flex-col items-end">
                  {product.productType === "combo" ? (
                    <span className="font-bold text-primary whitespace-nowrap">
                      Variável
                    </span>
                  ) : product.promotionalPrice ? (
                    <>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="font-bold text-red-600 whitespace-nowrap">
                        {formatCurrency(product.promotionalPrice)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-primary whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {product.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span className="capitalize">
                  {product.productType === "simple"
                    ? "Simples"
                    : product.productType === "flavors"
                      ? "Com Sabores"
                      : "Combo"}
                </span>
                <span
                  className={
                    product.isAvailable ? "text-green-500" : "text-destructive"
                  }
                >
                  {product.isAvailable ? "Disponível" : "Indisponível"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Nenhum produto encontrado
          </h3>
          <p className="text-muted-foreground mt-1">
            Tente buscar por outro termo ou categoria
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Image Upload Preview */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Imagem do Produto
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-video bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <span className="text-xs">
                            Clique para fazer upload
                          </span>
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: X-Bacon"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-[120px]"
                      placeholder="Descreva os ingredientes e detalhes do produto..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ingredientes (Opcional)
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
                          placeholder="Adicionar ingrediente (ex: Cebola)"
                        />
                        <Button
                          type="button"
                          onClick={handleAddIngredient}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {formData.ingredients &&
                        formData.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.ingredients.map((ingredient, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                              >
                                <span>{ingredient}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(index)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tipo de Produto
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="simple"
                          checked={formData.productType === "simple"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              productType: e.target.value as any,
                            }))
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Simples</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="flavors"
                          checked={formData.productType === "flavors"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              productType: e.target.value as any,
                            }))
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">
                          Com Sabores
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="combo"
                          checked={formData.productType === "combo"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              productType: e.target.value as any,
                            }))
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">
                          por Quant.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Seção de Sabores */}
                  {formData.productType === "flavors" && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                      <h4 className="font-medium text-sm mb-3">Sabores</h4>

                      {/* Configuração de Quantidade */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Mínimo de Sabores
                          </label>
                          <input
                            type="number"
                            value={formData.minFlavors}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                minFlavors: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Máximo de Sabores
                          </label>
                          <input
                            type="number"
                            value={formData.maxFlavors}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                maxFlavors: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Lista de Sabores Adicionados */}
                      {formData.flavors.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {formData.flavors.map((flavor) => (
                            <div
                              key={flavor.id}
                              className="flex items-center justify-between bg-background p-2 rounded border"
                            >
                              <div className="text-sm">
                                <span className="font-medium">
                                  {flavor.name}
                                </span>
                                {parseFloat(flavor.price) > 0 && (
                                  <span className="text-muted-foreground ml-2">
                                    (+{formatCurrency(parseFloat(flavor.price))}
                                    )
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFlavor(flavor.id)}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Adicionar Novo Sabor */}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Nome do Sabor
                          </label>
                          <input
                            type="text"
                            value={newFlavor.name}
                            onChange={(e) =>
                              setNewFlavor((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            placeholder="Ex: Bacon"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Valor (+)
                          </label>
                          <input
                            type="number"
                            value={newFlavor.price}
                            onChange={(e) =>
                              setNewFlavor((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddFlavor}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Seção de Combo */}
                  {formData.productType === "combo" && (
                    <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                      <h4 className="font-medium text-sm mb-3">
                        Configuração do Combo
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione grupos de escolha para o combo (ex: "Escolha 2
                        Lanches", "Adicionais Obrigatórios").
                      </p>

                      <div className="space-y-4">
                        {formData.comboConfig?.groups?.map(
                          (group, groupIndex) => (
                            <div
                              key={group.id}
                              className="bg-background border rounded-lg p-4"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h5 className="font-medium text-sm">
                                  Grupo {groupIndex + 1}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: prev.comboConfig.groups.filter(
                                          (g) => g.id !== group.id,
                                        ),
                                      },
                                    }));
                                  }}
                                  className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    Título do Grupo
                                  </label>
                                  <input
                                    type="text"
                                    value={group.title}
                                    onChange={(e) => {
                                      const newGroups = [
                                        ...formData.comboConfig.groups,
                                      ];
                                      newGroups[groupIndex].title =
                                        e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        comboConfig: {
                                          ...prev.comboConfig,
                                          groups: newGroups,
                                        },
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                    placeholder="Ex: Escolha seu Lanche"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    Tipo de Escolha
                                  </label>
                                  <select
                                    value={group.type}
                                    onChange={(e) => {
                                      const newGroups = [
                                        ...formData.comboConfig.groups,
                                      ];
                                      newGroups[groupIndex].type = e.target
                                        .value as any;
                                      setFormData((prev) => ({
                                        ...prev,
                                        comboConfig: {
                                          ...prev.comboConfig,
                                          groups: newGroups,
                                        },
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                  >
                                    <option value="products">
                                      Produtos Cadastrados
                                    </option>
                                    <option value="custom">
                                      Itens Personalizados
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    Mínimo
                                  </label>
                                  <input
                                    type="number"
                                    value={group.min}
                                    onChange={(e) => {
                                      const newGroups = [
                                        ...formData.comboConfig.groups,
                                      ];
                                      newGroups[groupIndex].min =
                                        e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        comboConfig: {
                                          ...prev.comboConfig,
                                          groups: newGroups,
                                        },
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    Máximo
                                  </label>
                                  <input
                                    type="number"
                                    value={group.max}
                                    onChange={(e) => {
                                      const newGroups = [
                                        ...formData.comboConfig.groups,
                                      ];
                                      newGroups[groupIndex].max =
                                        e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        comboConfig: {
                                          ...prev.comboConfig,
                                          groups: newGroups,
                                        },
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                    min="1"
                                  />
                                </div>
                              </div>

                              {/* Group Content Based on Type */}
                              {group.type === "products" ? (
                                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-background">
                                  <label className="text-xs text-muted-foreground mb-2 block">
                                    Selecione os produtos disponíveis:
                                  </label>
                                  {products.map((product) => (
                                    <label
                                      key={product.id}
                                      className="flex items-center gap-2 py-1 hover:bg-secondary/50 rounded px-1 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={(
                                          group.productIds || []
                                        ).includes(product.id)}
                                        onChange={(e) => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          const currentIds =
                                            newGroups[groupIndex].productIds ||
                                            [];
                                          if (e.target.checked) {
                                            newGroups[groupIndex].productIds = [
                                              ...currentIds,
                                              product.id,
                                            ];
                                          } else {
                                            newGroups[groupIndex].productIds =
                                              currentIds.filter(
                                                (id) => id !== product.id,
                                              );
                                          }
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm">
                                        {product.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <label className="text-xs text-muted-foreground block">
                                    Opções Personalizadas:
                                  </label>
                                  {group.options?.map((option, optIndex) => (
                                    <div
                                      key={option.id}
                                      className="flex gap-2 items-center"
                                    >
                                      <input
                                        type="text"
                                        value={option.name}
                                        onChange={(e) => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          newGroups[groupIndex].options[
                                            optIndex
                                          ].name = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="flex-1 px-2 py-1 rounded border text-sm"
                                        placeholder="Nome (ex: Batata)"
                                      />
                                      <input
                                        type="number"
                                        value={option.price}
                                        onChange={(e) => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          newGroups[groupIndex].options[
                                            optIndex
                                          ].price = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="w-24 px-2 py-1 rounded border text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          newGroups[groupIndex].options =
                                            newGroups[
                                              groupIndex
                                            ].options.filter(
                                              (_, i) => i !== optIndex,
                                            );
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="text-destructive p-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newGroups = [
                                        ...formData.comboConfig.groups,
                                      ];
                                      if (!newGroups[groupIndex].options)
                                        newGroups[groupIndex].options = [];
                                      newGroups[groupIndex].options.push({
                                        id: Math.random()
                                          .toString(36)
                                          .substr(2, 9),
                                        name: "",
                                        price: "",
                                      });
                                      setFormData((prev) => ({
                                        ...prev,
                                        comboConfig: {
                                          ...prev.comboConfig,
                                          groups: newGroups,
                                        },
                                      }));
                                    }}
                                    className="w-full"
                                  >
                                    <Plus className="h-3 w-3 mr-2" /> Adicionar
                                    Opção
                                  </Button>
                                </div>
                              )}
                            </div>
                          ),
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              comboConfig: {
                                ...prev.comboConfig,
                                groups: [
                                  ...prev.comboConfig.groups,
                                  {
                                    id: Math.random().toString(36).substr(2, 9),
                                    title: "",
                                    type: "products",
                                    min: "1",
                                    max: "1",
                                    productIds: [],
                                    options: [],
                                  },
                                ],
                              },
                            }));
                          }}
                          className="w-full border-dashed border-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Adicionar Grupo ao
                          Combo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Produto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspect={16 / 9}
      />
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <ProdutosContent />
    </Suspense>
  );
}
