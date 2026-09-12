# Oficina Gestão Estratégica de Pessoas

Site do evento **Oficina Gestão Estratégica de Pessoas** (IFMA – Campus Grajaú),
construído com **React + Vite** e **Tailwind CSS**, com inscrição gravada em
tempo real no **Supabase**.

## Rodando localmente

```bash
npm install
npm run dev
```

O site abre em `http://localhost:5173`.

## Variáveis de ambiente

O arquivo `.env` já está incluído neste projeto com os valores do seu Supabase
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`), só para facilitar rodar
localmente. Ele está no `.gitignore` — ou seja, **não vai para o seu repositório
Git** e **não é lido automaticamente pela Vercel**. Use `.env.example` como
referência do formato esperado.

Para o build de produção (Vercel), configure essas duas variáveis no painel:
**Project Settings → Environment Variables**, com os mesmos valores.

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/`, pronta para qualquer hospedagem estática.

## Publicando na Vercel

1. Suba este projeto para um repositório no GitHub (sem o `.env`, ele já fica
   de fora automaticamente).
2. Na Vercel, clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta o framework Vite automaticamente
   (Build Command: `npm run build`, Output Directory: `dist`).
4. Antes de publicar, adicione as variáveis de ambiente
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em
   **Settings → Environment Variables** com os valores do seu projeto Supabase.
5. Clique em **Deploy**.

## Estrutura do projeto

```
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .env                  (não versionado — só para rodar local)
└── src/
    ├── main.jsx           # ponto de entrada do React
    ├── App.jsx            # todo o site (Hero, Sobre, Programação,
    │                       # Inscrição, Certificado, Admin, etc.)
    ├── index.css           # diretivas do Tailwind
    └── lib/
        └── supabaseClient.js  # cliente do @supabase/supabase-js
```

## Sobre a tabela `inscricoes` no Supabase

O formulário de inscrição grava diretamente na tabela `inscricoes` os campos:
`nome`, `email`, `whatsapp`, `instituicao`, `cidade`. Os campos `id`,
`created_at`, `presenca`, `certificado_emitido` e `codigo_certificado` são
tratados pelo banco/sistema e não são enviados pelo formulário.

## Painel administrativo, presença e certificado

Por enquanto, a Área Administrativa, a confirmação de presença e a emissão de
certificado continuam usando armazenamento local do navegador
(`localStorage`) — a mesma lógica que existia no protótipo, adaptada para
funcionar em um site real. Se quiser, dá para migrar essa parte para o
Supabase também, em uma próxima etapa.
