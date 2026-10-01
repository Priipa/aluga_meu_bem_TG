# 🏠 Aluga Meu Bem

O **Aluga Meu Bem** é uma aplicação desenvolvida como **Trabalho de Graduação (TG)** do curso de **Análise e Desenvolvimento de Sistemas da FATEC Carapicuíba**.

A plataforma tem como objetivo facilitar o **aluguel e o compartilhamento de objetos entre moradores de condomínios**, permitindo que itens pouco utilizados possam ser disponibilizados para outros moradores por determinado período.

A proposta busca incentivar a **economia circular**, o consumo consciente e o melhor aproveitamento de recursos já existentes.

---

## 📌 Sobre o projeto

Muitas pessoas possuem objetos que são utilizados poucas vezes, como ferramentas, equipamentos, utensílios e outros itens.

Ao mesmo tempo, outras pessoas podem precisar desses mesmos objetos apenas temporariamente, tornando desnecessária a compra de um produto novo.

O **Aluga Meu Bem** conecta essas duas necessidades dentro do ambiente de condomínios.

O usuário cadastrado fica vinculado a um condomínio e pode visualizar os anúncios disponíveis para aquele ambiente. Usuários que optarem por atuar como locadores também podem publicar seus próprios itens.

---

## ✨ Funcionalidades

Atualmente, o projeto possui funcionalidades como:

- Cadastro de usuários;
- Login e autenticação com Firebase Authentication;
- Vinculação do usuário a condomínio e unidade;
- Proteção de rotas para usuários autenticados;
- Perfil do usuário;
- Ativação do perfil de locador mediante aceite dos termos;
- Publicação de anúncios;
- Upload de imagens dos anúncios;
- Visualização dos anúncios disponíveis no condomínio;
- Busca de anúncios;
- Filtro por categoria;
- Favoritos;
- Controle de acesso aos dados por meio das regras do Firebase.

O projeto continua em desenvolvimento e novas funcionalidades serão adicionadas conforme a evolução do TG.

---

## 🛠️ Tecnologias

### Frontend

- Ionic
- Angular
- TypeScript
- HTML
- SCSS

### Backend e infraestrutura

O projeto utiliza o **Firebase** como Backend as a Service (BaaS).

Serviços utilizados:

- **Firebase Authentication** — cadastro, login e gerenciamento da autenticação;
- **Cloud Firestore** — armazenamento dos dados da aplicação;
- **Firebase Storage** — armazenamento das imagens dos anúncios.

---

## 🏗️ Arquitetura

A aplicação utiliza uma arquitetura organizada principalmente em:

```text
Interface / Páginas
        ↓
Serviços da aplicação
        ↓
Firebase SDK
        ↓
Firebase
├── Authentication
├── Firestore
└── Storage
```

As páginas e componentes são responsáveis pela interface com o usuário, enquanto os serviços centralizam regras de acesso e comunicação com os recursos do Firebase.

A autorização dos dados não depende apenas do frontend. O projeto também utiliza **Security Rules do Firestore e do Storage** para controlar o acesso aos recursos.

---

## 📱 Plataforma

A aplicação está sendo desenvolvida para:

- 📱 Android.

O produto final será disponibilizado em formato **APK**.

---

# 🚀 Executando o projeto localmente

## Pré-requisitos

Antes de começar, instale:

- **Git**
- **Node.js**
- **npm**
- **Ionic CLI**

Para instalar o Ionic CLI globalmente:

```bash
npm install -g @ionic/cli
```

Você também precisará ter acesso a um **projeto Firebase** caso queira utilizar autenticação, banco de dados e armazenamento de imagens.

---

## 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
```

---

## 2. Acesse a pasta do projeto

```bash
cd aluga-meu-bem
```

> Caso o repositório possua uma pasta interna contendo a aplicação Angular/Ionic, acesse essa pasta antes de executar os próximos comandos.

---

## 3. Instale as dependências

```bash
npm install
```

Esse comando instalará as dependências definidas no `package.json`.

---

## 4. Configure o Firebase

A aplicação precisa estar conectada a um projeto Firebase para utilizar os recursos de backend.

No Firebase, o projeto utiliza:

```text
Firebase
│
├── Authentication
│   └── Cadastro e login
│
├── Cloud Firestore
│   ├── Usuários
│   ├── Condomínios
│   ├── Vínculos
│   └── Anúncios
│
└── Storage
    └── Imagens dos anúncios
```

A configuração do Firebase utilizada pelo frontend deve corresponder ao projeto Firebase que será utilizado no ambiente.

> As configurações públicas utilizadas pelo Firebase SDK no frontend não substituem mecanismos de segurança. A proteção dos dados é realizada principalmente por autenticação, regras do Firestore e regras do Storage.

Nunca publique no repositório **chaves privadas, contas de serviço, arquivos administrativos ou outras credenciais secretas**.

---

## 5. Execute o projeto

```bash
ionic serve
```

Após a compilação, o terminal informará o endereço local da aplicação, normalmente:

```text
http://localhost:8100
```

Abra esse endereço no navegador para executar e testar a aplicação durante o desenvolvimento.

---

# 🔥 Estrutura do Firebase

## Authentication

O Firebase Authentication é responsável pela autenticação dos usuários.

O cadastro da aplicação cria a conta somente ao final do fluxo de registro.

---

## Cloud Firestore

Entre as principais coleções utilizadas atualmente estão:

```text
condominios/
usuarios/
vinculos/
anuncios/
```

### `condominios`

Armazena os condomínios disponíveis para cadastro.

### `usuarios`

Armazena os dados do perfil do usuário.

### `vinculos`

Relaciona o usuário ao condomínio e à unidade correspondente.

### `anuncios`

Armazena os itens publicados pelos locadores.

---

## Firebase Storage

As imagens dos anúncios são armazenadas seguindo a estrutura:

```text
anuncios/{uid}/{anuncioId}/{arquivo}
```

O acesso é controlado pelas regras do Firebase Storage.

---

# 🔐 Regras e índices do Firebase

O repositório contém arquivos necessários para configurar o backend Firebase utilizado pela aplicação.

Entre eles:

```text
firestore.rules
firestore.indexes.json
storage.rules
```

Esses arquivos representam, respectivamente:

- regras de segurança do Cloud Firestore;
- índices necessários para consultas do Firestore;
- regras de segurança do Firebase Storage.

Ao utilizar outro projeto Firebase, essas configurações também precisam ser publicadas no projeto correspondente.

---

## Firebase CLI

Para trabalhar com regras, índices e deploy do Firebase, instale o Firebase CLI:

```bash
npm install -g firebase-tools
```

Faça login:

```bash
firebase login
```

Depois, confira qual projeto Firebase está selecionado antes de qualquer publicação:

```bash
firebase use
```

> ⚠️ Antes de executar qualquer comando de deploy, confirme que o Firebase CLI está apontando para o projeto correto.

Quando necessário, as configurações podem ser publicadas individualmente.

### Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Índices do Firestore

```bash
firebase deploy --only firestore:indexes
```

### Storage Rules

```bash
firebase deploy --only storage
```

Evite executar um deploy geral sem verificar quais recursos serão alterados.

---

# 🧪 Build

Para gerar uma build da aplicação:

```bash
ng build
```

ou:

```bash
ionic build
```

Não é necessário executar uma nova build após cada pequena alteração durante o desenvolvimento. Ela é recomendada após alterações relevantes, antes de validações importantes ou antes de processos de publicação.

---

# 📂 Estrutura geral

A estrutura pode evoluir durante o desenvolvimento, mas os principais diretórios seguem a organização do Angular/Ionic:

```text
src/
├── app/
│   ├── core/
│   ├── pages/
│   └── ...
├── assets/
├── environments/
└── theme/

firestore.rules
firestore.indexes.json
storage.rules
firebase.json
```

---

# 🔐 Segurança

O projeto utiliza diferentes camadas de proteção.

### Autenticação

O Firebase Authentication identifica o usuário autenticado.

### Firestore Security Rules

As regras do Firestore controlam quais documentos cada usuário pode consultar, criar ou alterar.

Entre os controles existentes estão:

- acesso condicionado à autenticação;
- vínculo entre usuário e condomínio;
- controle sobre os dados do próprio usuário;
- validações para publicação de anúncios;
- restrição de acesso aos anúncios conforme o condomínio.

### Storage Security Rules

O Storage possui regras específicas para upload e remoção das imagens dos anúncios.

O caminho dos arquivos associa o conteúdo ao usuário e ao anúncio correspondente.

> ⚠️ Nunca considere validações feitas apenas no frontend como mecanismo suficiente de segurança.

---

# ♻️ Economia circular

O **Aluga Meu Bem** utiliza a tecnologia como ferramenta para incentivar um modelo de consumo baseado no compartilhamento e na reutilização.

```text
Objeto disponível
       ↓
Publicação
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

Em vez de um objeto permanecer sem utilização ou uma nova compra ser realizada para atender uma necessidade temporária, a plataforma busca facilitar o aproveitamento dos objetos já existentes.

---

# 🎓 Contexto acadêmico

Projeto desenvolvido como **Trabalho de Graduação (TG)** do curso de:

**Análise e Desenvolvimento de Sistemas**  
**FATEC Carapicuíba**

Desenvolvimento e apresentação durante o ano de **2026**.

---

# 👩‍💻 Desenvolvimento

Projeto acadêmico desenvolvido por estudantes da **FATEC Carapicuíba**.

---

# 📄 Status

🚧 **Em desenvolvimento**

O projeto ainda está em evolução. Funcionalidades, estrutura de dados, regras de segurança e documentação podem sofrer alterações durante o desenvolvimento do Trabalho de Graduação.
