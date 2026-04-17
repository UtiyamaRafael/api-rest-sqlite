# Biblioteca Digital API

Sistema de biblioteca digital com backend em Node.js + Express, autenticacao com JWT, validacao com Zod e banco SQLite. O projeto tambem conta com uma interface web simples para login, cadastro, consulta de livros, filtros de busca, emprestimos e cadastro de novos livros.

## Funcionalidades

- Cadastro e login de usuarios com JWT
- Listagem, criacao, edicao e remocao de livros
- Filtros de busca para livros
- Controle de emprestimos
- Listagem de usuarios
- Validacao de dados com Zod
- Protecao de rotas com autenticacao
- Interface web servida pelo proprio Express

## Tecnologias utilizadas

- Node.js
- Express
- SQLite3
- JWT
- Zod
- Bootstrap

## Estrutura do projeto

```bash
project/
  public/        # Frontend da aplicacao
  src/
    controllers/ # Regras de entrada das rotas
    services/    # Regras de negocio
    repositories/# Acesso ao banco
    routes/      # Endpoints da API
    middlewares/ # Auth, validacao e tratamento de erros
    validators/  # Schemas com Zod
  server.js      # Inicializacao do servidor
```

## Como executar o projeto

### 1. Entrar na pasta do projeto

```bash
cd project
```

### 2. Instalar as dependencias

```bash
npm install
```

### 3. Executar em desenvolvimento

```bash
npm run dev
```

### 4. Executar em producao

```bash
npm start
```

Servidor padrao:

```bash
http://localhost:3000
```

## Variaveis de ambiente

Crie um arquivo `.env` na pasta `project` com base no exemplo abaixo:

```env
PORT=3000
DATABASE_FILE=./database.sqlite
JWT_SECRET=seu_segredo_aqui
JWT_EXPIRES_IN=2h
```

## Rotas principais

### Autenticacao

- `POST /auth/register` - registra um novo usuario
- `POST /auth/login` - faz login e retorna token JWT

### Usuarios

- `GET /users` - lista usuarios
- `GET /users/:id` - busca usuario por id
- `PUT /users/:id` - atualiza usuario
- `DELETE /users/:id` - remove usuario

### Livros

- `GET /api/books` - lista livros
- `GET /api/books/:id` - busca livro por id
- `POST /api/books` - cria livro
- `PUT /api/books/:id` - atualiza livro
- `DELETE /api/books/:id` - remove livro

Filtros aceitos em `GET /api/books`:

- `title`
- `author`
- `isbn`
- `available`
- `sort`
- `order`
- `page`
- `limit`

### Emprestimos

- `GET /api/loans` - lista emprestimos
- `GET /api/loans/:id` - busca emprestimo por id
- `POST /api/loans` - cria emprestimo
- `PUT /api/loans/:id` - registra devolucao/atualizacao
- `DELETE /api/loans/:id` - remove emprestimo

## Interface web

A interface web fica disponivel na raiz da aplicacao e permite:

- fazer login
- criar conta
- visualizar livros
- filtrar livros
- adicionar livros
- solicitar emprestimos
- listar usuarios

## Exemplo de login

```json
POST /auth/login
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

Resposta esperada:

```json
{
  "message": "Login efetuado com sucesso",
  "token": "seu_jwt_aqui"
}
```

## Autor

Projeto desenvolvido para fins academicos e praticos, com foco em API REST completa, autenticacao e integracao com frontend simples.
