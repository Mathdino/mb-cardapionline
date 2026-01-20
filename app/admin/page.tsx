"use client";

import { useState, useEffect } from "react";
import {
  createCompany,
  getCompanies,
  resetPassword,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { KeyRound } from "lucide-react";

export default function AdminPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    const data = await getCompanies();
    setCompanies(data);
    setIsLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const result = await createCompany(formData);
    if (result.success) {
      await loadCompanies();
      // Reset form (simple way)
      const form = document.querySelector("form") as HTMLFormElement;
      form.reset();
    } else {
      alert("Erro ao criar empresa");
    }
    setIsLoading(false);
  }

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return;

    setIsLoading(true);
    const result = await resetPassword(selectedUser, newPassword);
    if (result.success) {
      alert("Senha redefinida com sucesso!");
      setIsResetDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    } else {
      alert("Erro ao redefinir senha");
    }
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Painel Admin</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form to create company */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Pizzaria do João"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  placeholder="ex: pizzaria-joao"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email do Admin</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@pizzaria.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Empresa"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List of companies */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.slug}</TableCell>
                    <TableCell>
                      {company.users?.map((u: any) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 mb-1"
                        >
                          <span className="text-sm">{u.email}</span>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {company.users?.map((u: any) => (
                        <div key={u.id} className="mb-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u.id);
                              setIsResetDialogOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma empresa cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isLoading || !newPassword}
            >
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
