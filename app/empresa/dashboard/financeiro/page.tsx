"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import {
  formatCurrency,
  orderStatusLabels,
  orderStatusColors,
} from "@/lib/mock-data";
import { TrendingUp, ShoppingBag, Package, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { getOrders } from "@/app/actions/order";
import { Order } from "@/lib/types";

type FilterPeriod = "week" | "month" | "year" | "custom";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function FinanceiroPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [period, setPeriod] = useState<FilterPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (company?.id) {
        setIsLoading(true);
        try {
          const data = await getOrders(company.id);
          const parsedOrders = data.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            items: order.items as any,
          }));
          setOrders(parsedOrders);
        } catch (error) {
          console.error("Failed to fetch orders", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchOrders();
  }, [company?.id]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          return orders;
        }
        break;
      default:
        startDate = new Date(0);
    }

    // Only include delivered orders for financial calculations
    return orders.filter((order) => {
      if (order.status !== "delivered") return false;

      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, period, customStartDate, customEndDate]);

  if (!company) return null;

  // Calculate statistics
  const stats = useMemo(() => {
    // Since filteredOrders already only contains delivered orders
    const delivered = filteredOrders;
    const totalRevenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const averageOrder =
      delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Top products
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    for (const order of delivered) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      }
    }

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      deliveredOrders: delivered.length,
      totalRevenue,
      averageOrder,
      topProducts,
    };
  }, [filteredOrders]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o desempenho da sua loja
        </p>
      </div>

      {/* Period Filter */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />

          <div className="flex flex-wrap gap-2">
            {[
              { value: "week", label: "Última Semana" },
              { value: "month", label: "Este Mês" },
              { value: "year", label: "Este Ano" },
              { value: "custom", label: "Personalizado" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as FilterPeriod)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Image
                src="/images/icon-real.png"
                alt="R$"
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pedidos</p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregues</p>
              <p className="text-xl font-bold text-foreground">
                {stats.deliveredOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats.averageOrder)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border rounded-xl flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-foreground">Produtos Mais Vendidos</h2>
        </div>

        {stats.topProducts.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhuma venda no período selecionado
          </p>
        ) : (
          <div className="p-4 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="quantity"
                  nameKey="name"
                >
                  {stats.topProducts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string, item: any) => [
                    `${value} un. - ${formatCurrency(item.payload.revenue)}`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Orders History */}
      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-bold text-foreground">Histórico de Pedidos</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhum pedido no período selecionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
