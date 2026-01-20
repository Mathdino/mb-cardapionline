"use client"

import { useState } from 'react'
import type { Company, Category, Product } from '@/lib/types'
import { CartProvider } from '@/lib/cart-context'
import { RestaurantHeader } from '@/components/client/restaurant-header'
import { CategoryTabs } from '@/components/client/category-tabs'
import { ProductList } from '@/components/client/product-list'
import { CartSheet } from '@/components/client/cart-sheet'

interface RestaurantPageProps {
  company: Company
  categories: Category[]
  products: Product[]
}

const RestaurantPage = ({ company, categories, products }: RestaurantPageProps) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')

  return (
    <CartProvider>
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <RestaurantHeader company={company} />
        
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        
        <ProductList
          categories={categories}
          products={products}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        
        <CartSheet company={company} />
      </div>
    </CartProvider>
  )
}

export default RestaurantPage
