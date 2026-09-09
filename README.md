# 🏠 Aluga Meu Bem!

O **Aluga Meu Bem!** é uma aplicação desenvolvida como **Trabalho de Graduação (TG)** do curso de **Análise e Desenvolvimento de Sistemas da FATEC Carapicuíba**.

A proposta da plataforma é facilitar o **aluguel e o compartilhamento de objetos entre pessoas**, permitindo que itens que normalmente ficam sem utilização possam ser disponibilizados para outras pessoas por determinado período.

A solução busca incentivar a **economia circular**, o consumo consciente e o melhor aproveitamento de recursos já existentes.

---

## 📌 Sobre o projeto

Muitas pessoas possuem objetos que são utilizados poucas vezes, como ferramentas, equipamentos, utensílios e outros itens.

Ao mesmo tempo, outras pessoas podem precisar desses mesmos objetos apenas temporariamente, tornando desnecessária a compra de um produto novo.

O **Aluga Meu Bem!** conecta essas duas necessidades.

A plataforma permite que usuários disponibilizem seus objetos para aluguel e que outros usuários encontrem itens disponíveis de acordo com suas necessidades.

---

## 🎯 Objetivo

Desenvolver uma plataforma simples e acessível para facilitar o aluguel de objetos entre usuários, promovendo:

* ♻️ Economia circular;
* 💰 Economia financeira;
* 🌱 Consumo consciente;
* 📦 Melhor aproveitamento de objetos ociosos;
* 🤝 Compartilhamento entre usuários.

---

## ⚙️ Funcionalidades previstas

Entre as principais funcionalidades da aplicação estão:

* Cadastro de usuários;
* Login e autenticação;
* Cadastro de objetos para aluguel;
* Edição e gerenciamento dos objetos cadastrados;
* Visualização de objetos disponíveis;
* Busca e filtros;
* Visualização dos detalhes de um objeto;
* Solicitação de aluguel;
* Gerenciamento dos aluguéis;
* Perfil do usuário;
* Histórico de movimentações;
* Controle da disponibilidade dos objetos.

Novas funcionalidades poderão ser adicionadas durante o desenvolvimento do projeto.

---

## 🛠️ Tecnologias

### Frontend

* Ionic
* Angular
* TypeScript
* HTML
* SCSS

### Backend e serviços

O projeto utilizará o **Firebase** como infraestrutura de backend.

Os principais serviços previstos são:

* **Firebase Authentication** — autenticação e gerenciamento dos usuários;
* **Cloud Firestore** — armazenamento dos dados da aplicação;
* **Firebase Storage** — armazenamento das imagens dos objetos.

Outros serviços poderão ser incorporados conforme as necessidades do projeto.

---

## 📱 Plataformas

A aplicação está sendo desenvolvida com foco em:

* 📱 Android;
* 🌐 Web;
* 📲 PWA.

---

## 📂 Estrutura do projeto

```text
src/
├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── models/
├── assets/
│   ├── images/
│   └── icons/
├── environments/
└── theme/
```

A estrutura poderá sofrer alterações conforme a evolução da aplicação.

---

## 🚀 Executando o projeto

### Pré-requisitos

Antes de executar o projeto, é necessário possuir:

* Node.js;
* npm;
* Ionic CLI;
* Git.

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
```

### 2. Acesse a pasta do projeto

```bash
cd aluga-meu-bem
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute o projeto

```bash
ionic serve
```

A aplicação será iniciada em ambiente de desenvolvimento.

---

## 🔥 Firebase

O Firebase será utilizado para fornecer os principais serviços de backend da aplicação.

```text
Firebase
│
├── Authentication
│   └── Cadastro e autenticação dos usuários
│
├── Cloud Firestore
│   └── Dados da aplicação
│
└── Firebase Storage
    └── Imagens dos objetos
```

As configurações do Firebase devem ser realizadas de acordo com o ambiente utilizado no projeto.

Credenciais, chaves privadas ou outros dados sensíveis **não devem ser publicados no repositório**.

---

## 🔐 Segurança

Durante o desenvolvimento serão consideradas boas práticas relacionadas a:

* Autenticação dos usuários;
* Autorização de acesso aos dados;
* Regras de segurança do Firestore;
* Regras de acesso ao Firebase Storage;
* Validação das informações enviadas pelos usuários;
* Proteção de informações pessoais;
* Separação entre ambientes de desenvolvimento e produção.

---

## ♻️ Economia circular

O **Aluga Meu Bem!** utiliza a tecnologia como ferramenta para incentivar um modelo de consumo baseado no compartilhamento e reutilização.

Em vez de um objeto permanecer sem utilização ou uma nova compra ser realizada para atender uma necessidade temporária, a plataforma permite que objetos existentes sejam utilizados por outras pessoas.

```text
Objeto disponível
       ↓
Compartilhamento
       ↓
Aluguel
       ↓
Utilização
       ↓
Devolução
       ↓
Objeto disponível novamente
```

---

## 🎓 Contexto acadêmico

Projeto desenvolvido como **Trabalho de Graduação (TG)** do curso de:

**Análise e Desenvolvimento de Sistemas**
**FATEC Carapicuíba**

O projeto será desenvolvido e apresentado durante o ano de **2026**.

---

## 👩‍💻 Desenvolvimento

Projeto acadêmico desenvolvido por estudantes da **FATEC Carapicuíba**.

---

## 📄 Status

🚧 **Em desenvolvimento**

A documentação será atualizada conforme novas funcionalidades forem implementadas.
