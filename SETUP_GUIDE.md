# Guia de Configuração do Projeto - MB Cardápio Online

Este documento descreve os passos necessários para configurar o ambiente de desenvolvimento, instalar dependências e preparar o banco de dados.

## 1. Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- **Node.js** (Versão 18 ou superior)
- **PostgreSQL** (Rodando localmente ou via Docker)
- Um gerenciador de pacotes (**npm** ou **pnpm**)

---

## 2. Instalação de Dependências

Abra o terminal na raiz do projeto e execute:

```powershell
# Usando pnpm (Recomendado)
pnpm install

# Ou usando npm
npm install
```

---

## 3. Configuração de Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes configurações:

```env
# Conexão com o Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/NOME_DO_BANCO?schema=public"

# Configurações de Autenticação (NextAuth)
NEXTAUTH_SECRET="sua_chave_secreta_aqui"
NEXTAUTH_URL="http://localhost:3000"

# Opcional: Provedores de Autenticação
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 4. Configuração do Banco de Dados (Prisma)

O projeto utiliza Prisma para gerenciar o banco de dados. Execute os comandos abaixo na ordem:

### A. Gerar o Prisma Client
Gera os tipos TypeScript baseados no seu esquema:
```powershell
npx prisma generate
```

### B. Criar Tabelas e Migrações
Cria a estrutura de tabelas no seu banco de dados PostgreSQL:
```powershell
npx prisma migrate dev --name init
```

### C. Visualizar Dados (Opcional)
Abre uma interface gráfica no navegador para gerenciar os dados:
```powershell
npx prisma studio
```

---

## 5. Executando o Projeto

Após concluir os passos acima, você pode iniciar o servidor de desenvolvimento:

```powershell
npm run dev
```

O projeto estará disponível em: [http://localhost:3000](http://localhost:3000)

---

## Resumo de Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| `npm install` | Instala todas as dependências |
| `npx prisma generate` | Atualiza o cliente do banco de dados |
| `npx prisma migrate dev` | Sincroniza o banco com o schema |
| `npm run build` | Gera a versão de produção |
| `npm run dev` | Inicia o modo de desenvolvimento |
