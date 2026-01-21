"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  formatCurrency,
  orderStatusLabels,
  orderStatusColors,
  paymentMethodLabels,
} from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import { Search, Filter, X, Phone, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getOrders, updateOrderStatus } from "@/app/actions/order";

const Loading = () => null;

export default function PedidosPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const searchParams = useSearchParams();
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

  if (!company) return null;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "preparing", label: "Em Preparação" },
    { value: "delivered", label: "Entregues" },
    { value: "cancelled", label: "Cancelados" },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder || !company) return;

    // Optimistic update
    const previousOrder = selectedOrder;
    const previousOrders = orders;

    const updatedOrder = { ...selectedOrder, status: newStatus };
    setSelectedOrder(updatedOrder);
    setOrders(
      orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)),
    );

    const result = await updateOrderStatus(
      selectedOrder.id,
      company.id,
      newStatus,
    );

    if (!result.success) {
      // Revert on failure
      setSelectedOrder(previousOrder);
      setOrders(previousOrders);
      alert("Erro ao atualizar status do pedido");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pedidos da sua loja
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Nº do Pedido
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Itens
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
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 text-sm text-foreground">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {order.customerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {order.items.length} item(s)
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
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full p-4 text-left hover:bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        {order.customerName}
                      </span>
                      <span
                        className={`px-2 py-1.5 rounded-full text-sm font-medium ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        #{order.id} - {order.items.length} item(s)
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 && (
                <p className="p-8 text-center text-muted-foreground">
                  Nenhum pedido encontrado
                </p>
              )}
            </>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedOrder(null)}
            />

            <div className="relative bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
                <h2 className="text-lg font-bold text-foreground">
                  Pedido #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-secondary rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${orderStatusColors[selectedOrder.status]}`}
                  >
                    {orderStatusLabels[selectedOrder.status]}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <h3 className="font-medium text-foreground mb-2">Cliente</h3>
                  <p className="text-foreground">
                    {selectedOrder.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.customerPhone}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Itens do Pedido
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 flex-1">
                            <div className="bg-background border px-2 py-1 rounded text-sm font-bold h-fit shrink-0">
                              {item.quantity}x
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {item.productName}
                              </p>

                              {/* Flavors */}
                              {item.selectedFlavors &&
                              item.selectedFlavors.length > 0 ? (
                                <div className="mt-1.5 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Sabores
                                  </p>
                                  <ul className="text-sm text-muted-foreground space-y-0.5">
                                    {item.selectedFlavors.map((flavor, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                        {item.selectedFlavors!.length > 1
                                          ? `1/${item.selectedFlavors!.length} ${flavor}`
                                          : flavor}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                item.selectedFlavor && (
                                  <div className="mt-1.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Sabor
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.selectedFlavor}
                                    </p>
                                  </div>
                                )
                              )}

                              {/* Combo Items */}
                              {item.comboItems &&
                                item.comboItems.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Itens do Combo
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-0.5">
                                      {item.comboItems.map((ci, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-center gap-2"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/30" />
                                          {ci}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Removed Ingredients */}
                              {item.removedIngredients &&
                                item.removedIngredients.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-red-500 uppercase tracking-wider">
                                      Remover
                                    </p>
                                    <p className="text-sm text-red-500">
                                      {item.removedIngredients.join(", ")}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Observações
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Payment & Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Forma de Pagamento
                    </span>
                    <span className="text-foreground">
                      {paymentMethodLabels[selectedOrder.paymentMethod]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-foreground text-lg">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedOrder.status === "pending" && (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => handleStatusUpdate("preparing")}
                      >
                        Aceitar Pedido
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleStatusUpdate("cancelled")}
                      >
                        Recusar
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("delivered")}
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
