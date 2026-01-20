"use client"

import React, { useEffect } from "react"

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { getProducts } from '@/app/actions/products'
import { formatCurrency } from '@/lib/utils'
import type { Product, Promotion } from '@/lib/types'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PromocoesPage() {
  const { getCompany } = useAuth()
  const company = getCompany()
  
  const [products, setProducts] = useState<any[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  
  useEffect(() => {
    async function loadProducts() {
      if (company?.id) {
        const productsData = await getProducts(company.id);
        setProducts(productsData);
      }
    }
    loadProducts();
  }, [company]);

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    promotionalPrice: '',
    startDate: '',
    endDate: ''
  })

  if (!company) return null

  const getProductById = (id: string): Product | undefined => products.find(p => p.id === id)

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion)
      setFormData({
        productId: promotion.productId,
        promotionalPrice: promotion.promotionalPrice.toString(),
        startDate: new Date(promotion.startDate).toISOString().split('T')[0],
        endDate: new Date(promotion.endDate).toISOString().split('T')[0]
      })
    } else {
      setEditingPromotion(null)
      setFormData({
        productId: '',
        promotionalPrice: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPromotion(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const product = getProductById(formData.productId)
    if (!product) return

    if (editingPromotion) {
      setPromotions(prev => prev.map(p => 
        p.id === editingPromotion.id 
          ? { 
              ...p, 
              productId: formData.productId,
              originalPrice: product.price,
              promotionalPrice: parseFloat(formData.promotionalPrice),
              startDate: new Date(formData.startDate),
              endDate: new Date(formData.endDate)
            }
          : p
      ))
    } else {
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        companyId: company.id,
        productId: formData.productId,
        originalPrice: product.price,
        promotionalPrice: parseFloat(formData.promotionalPrice),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: true
      }
      setPromotions(prev => [...prev, newPromotion])
    }
    
    handleCloseModal()
  }

  const handleDelete = (promotionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta promoção?')) {
      setPromotions(prev => prev.filter(p => p.id !== promotionId))
    }
  }

  const toggleActive = (promotionId: string) => {
    setPromotions(prev => prev.map(p => 
      p.id === promotionId ? { ...p, isActive: !p.isActive } : p
    ))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground mt-1">
            Crie promoções para aumentar suas vendas
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {/* Promotions List */}
      <div className="grid gap-4">
        {promotions.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Nenhuma promoção cadastrada. Clique em "Nova Promoção" para começar.
            </p>
          </div>
        ) : (
          promotions.map(promotion => {
            const product = getProductById(promotion.productId)
            if (!product) return null

            const discount = Math.round(((promotion.originalPrice - promotion.promotionalPrice) / promotion.originalPrice) * 100)

            return (
              <div 
                key={promotion.id}
                className={`bg-card border rounded-xl overflow-hidden ${!promotion.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="relative h-32 md:h-auto md:w-48 bg-secondary flex-shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                      -{discount}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-lg text-muted-foreground line-through">
                            {formatCurrency(promotion.originalPrice)}
                          </span>
                          <span className="text-2xl font-bold text-red-600">
                            {formatCurrency(promotion.promotionalPrice)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>De: {formatDate(promotion.startDate)}</span>
                          <span>Até: {formatDate(promotion.endDate)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          promotion.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {promotion.isActive ? 'Ativa' : 'Inativa'}
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(promotion.id)}
                          >
                            {promotion.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(promotion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(promotion.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          
          <div className="relative bg-card rounded-xl max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-foreground">
                {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-secondary rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Produto
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.productId && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Preço original: <strong className="text-foreground">
                      {formatCurrency(getProductById(formData.productId)?.price || 0)}
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preço Promocional (R$)
                </label>
                <input
                  type="number"
                  value={formData.promotionalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, promotionalPrice: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingPromotion ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
