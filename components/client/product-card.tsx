"use client"

import Image from 'next/image'
import type { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const displayPrice = product.isPromotion && product.promotionalPrice 
    ? product.promotionalPrice 
    : product.price

  return (
    <button
      onClick={onClick}
      className="flex gap-3 p-3 border-b last:border-b-0 w-full text-left hover:bg-secondary/50 transition-colors"
    >
      {/* Product Image */}
      <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
        />
        {product.isPromotion && (
          <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
            Promo
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-medium text-foreground truncate">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          {product.isPromotion && product.promotionalPrice ? (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
              <span className="font-semibold text-red-600">
                {formatCurrency(product.promotionalPrice)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-foreground">
              {formatCurrency(displayPrice)}
            </span>
          )}
          
          {product.productType === 'flavors' && (
            <span className="text-xs text-muted-foreground">a partir de</span>
          )}
        </div>
      </div>
    </button>
  )
}
