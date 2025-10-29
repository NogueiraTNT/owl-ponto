# 🦉 OWL-PONTO ETL

Sistema automatizado para transferir arquivos AFD de relógios de ponto (Henry) para servidor Hostinger.

## 🎯 O Que Este Script Faz

1. **Acessa** o relógio de ponto via navegador (http://192.168.15.10)
2. **Faz login** automaticamente com usuário e senha
3. **Navega** para: Eventos → Filtro por data/hora
4. **Preenche** data inicial (hoje 00:00) e final (hoje 23:59)
5. **Clica** em "Baixar Dados"
6. **Baixa** o arquivo AFD do dia atual
7. **Renomeia** com identificador único + timestamp
8. **Envia** para o servidor Hostinger via FTP
9. **Limpa** arquivos temporários
10. **Encerra** completamente (não fica rodando)

---

## ⚡ INSTALAÇÃO RÁPIDA (10 minutos)

### 1️⃣ Instalar Node.js

- Baixe: https://nodejs.org/
- Durante instalação: ✅ Marque **"Add to PATH"**
- Reinicie o computador após instalação

### 2️⃣ Instalar Dependências

```bash
# Navegue até a pasta do projeto
cd D:\Projetos\owl-ponto

# Instale as dependências (vai baixar ~200MB do Puppeteer)
npm install
```

**⏳ Aguarde**: O Puppeteer baixa o Chrome automaticamente (~180MB). É normal demorar alguns minutos.

### 3️⃣ Configurar Credenciais

1. Renomeie `env.example` para `.env`
2. Edite o `.env` com suas credenciais:

```ini
# Relógio de Ponto
RELOGIO_URL="http://192.168.15.10"
RELOGIO_USER="admin"
RELOGIO_PASS="sua_senha"

# Hostinger
HOSTINGER_FTP_HOST="ftp.rederwp.com"
HOSTINGER_FTP_USER="u504951644"
HOSTINGER_FTP_PASS="sua_senha_ftp"
HOSTINGER_REMOTE_FOLDER_PATH="/public_html/pontos/"

# Identificador
MACHINE_ID="LOJA_01"
```

### 4️⃣ Testar

```bash
npm start
```

**Resultado esperado**:

```
✅ Configurações validadas!
🌐 Acessando: http://192.168.15.10
✅ Login realizado com sucesso!
✅ Arquivo baixado: AFD.txt
✅ Conectado à Hostinger!
✅ Upload concluído com sucesso!
✅ ETL CONCLUÍDO COM SUCESSO!
```

---

## 📅 AGENDAR NO WINDOWS (Automático 24/7)

### Passo 1: Abrir Agendador de Tarefas

1. Pressione `Win + R`
2. Digite: `taskschd.msc`
3. Enter

### Passo 2: Criar Nova Tarefa

1. No painel direito, clique em **"Criar Tarefa..."**
   - ⚠️ NÃO clique em "Criar Tarefa Básica"

### Passo 3: Aba "Geral"

- **Nome**: `OWL-PONTO ETL - LOJA 01`
- **Descrição**: `Transferência automática de ponto para Hostinger`
- ✅ **Marcar**: "Executar estando o usuário conectado ou não"
- ✅ **Marcar**: "Executar com privilégios mais altos"
- ✅ **Marcar**: "Oculto"

### Passo 4: Aba "Gatilhos"

1. Clique em **"Novo..."**
2. **Iniciar a tarefa**: `Segundo um agendamento`
3. **Configurações**: `Diariamente`
4. **Hora de início**: `00:00:00`
5. **Repetir a tarefa a cada**: ✅ **Marcar** e selecionar `10 minutos`
6. **Por um período de**: `Indefinidamente`
7. **Habilitado**: ✅ **Marcar**
8. OK

### Passo 5: Aba "Ações"

1. Clique em **"Novo..."**
2. **Ação**: `Iniciar um programa`
3. **Programa/script**: `D:\Projetos\owl-ponto\executar.bat`
4. **Iniciar em**: `D:\Projetos\owl-ponto`
5. OK

### Passo 6: Aba "Condições"

- ❌ **Desmarcar**: "Iniciar a tarefa apenas se o computador estiver conectado à energia CA"
- ❌ **Desmarcar**: "Parar se o computador passar para alimentação de bateria"

### Passo 7: Aba "Configurações"

- ✅ **Marcar**: "Permitir que a tarefa seja executada sob demanda"
- ✅ **Marcar**: "Executar tarefa assim que possível se um início agendado for perdido"
- **Parar a tarefa se ela for executada por mais de**: `1 hora`
- **Se a tarefa já estiver em execução**: `Não iniciar uma nova instância`

### Passo 8: Salvar

1. Clique em **OK**
2. Digite suas credenciais do Windows
3. Pronto! A tarefa rodará automaticamente a cada 10 minutos

---

## 🔄 FLUXO ESPECÍFICO PARA SEU HENRY

O script está configurado para seguir este caminho exato no seu relógio:

```
1. Login (usuário + senha)
2. Clicar em "Eventos"
3. Clicar em "Filtro por data/hora"
4. Preencher "Inicial:" com 28/10/25 00:00 (data de hoje)
5. Preencher "Final:" com 28/10/25 23:59 (data de hoje)
6. Clicar em "Baixar Dados"
7. Download automático do arquivo AFD
```

O navegador abrirá **visível** (não oculto) para você acompanhar o processo!

---

## 🔧 AJUSTANDO SELETORES (SE NECESSÁRIO)

⚠️ Se o script não encontrar algum botão/campo, você pode precisar ajustar os seletores CSS no código.

### Como Descobrir os Seletores Corretos:

1. Acesse o relógio pelo navegador: `http://192.168.15.10`
2. Pressione `F12` (Ferramentas do Desenvolvedor)
3. Use a ferramenta de seleção (ícone de seta)
4. Clique no campo de usuário
5. Veja o **seletor CSS** no painel inferior
6. Repita para senha e botão de login

### Locais para Ajustar no `index.js`:

O script tenta vários seletores automaticamente. Se falhar, você pode adicionar seletores específicos:

#### 1. Menu "Eventos" (linha ~166)

```javascript
const eventosSelectors = [
  'a:has-text("Eventos")',
  'a[href*="eventos"]',
  "#seuSeletorAqui", // <- Adicione aqui
];
```

#### 2. Botão "Filtro" (linha ~196)

```javascript
const filtroSelectors = [
  'a:has-text("Filtro por data/hora")',
  'button:has-text("Filtro")',
  "#seuSeletorAqui", // <- Adicione aqui
];
```

#### 3. Campo "Inicial" (linha ~240)

```javascript
const inicialSelectors = [
  'input[name*="inicial"]',
  'input[id*="inicial"]',
  "#seuSeletorAqui", // <- Adicione aqui
];
```

#### 4. Campo "Final" (linha ~271)

```javascript
const finalSelectors = [
  'input[name*="final"]',
  'input[id*="final"]',
  "#seuSeletorAqui", // <- Adicione aqui
];
```

#### 5. Botão "Baixar Dados" (linha ~304)

```javascript
const baixarSelectors = [
  'button:has-text("Baixar Dados")',
  'a:has-text("Baixar")',
  "#seuSeletorAqui", // <- Adicione aqui
];
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### ❌ Erro: "Cannot find module 'puppeteer'"

**Solução**: Execute `npm install` na pasta do projeto.

---

### ❌ Erro: "Login automático falhou"

**Causa**: Seletores CSS incorretos para o seu modelo de Henry.

**Solução**:

1. Use F12 no navegador para descobrir os seletores
2. Edite o `index.js` conforme explicado acima
3. Teste novamente

---

### ❌ Erro: "Não foi possível encontrar botão de exportar AFD"

**Causa**: O botão/link de AFD tem um seletor diferente.

**Solução**:

1. Acesse o relógio manualmente
2. Use F12 e inspecione o botão de exportar
3. Adicione o seletor correto no array `afdSelectors`

---

### ❌ Erro: "Nenhum arquivo AFD foi baixado"

**Possíveis causas**:

1. O download não iniciou (botão não foi clicado)
2. O arquivo tem nome diferente

**Solução**:

1. Teste manualmente: acesse o relógio e baixe o AFD
2. Veja o nome do arquivo baixado
3. Se não for `.txt`, edite esta parte do código:

```javascript
const afdFiles = files.filter(
  (f) =>
    f.toLowerCase().includes("afd") ||
    f.endsWith(".txt") ||
    f.endsWith(".dat") ||
    f.endsWith(".seu_formato") // <- Adicione seu formato aqui
);
```

---

### ❌ Erro: "ENOTFOUND ftp.rederwp.com"

**Causa**: Host FTP incorreto.

**Solução**:

1. Acesse o painel da Hostinger
2. Vá em: **Arquivos** → **Contas FTP**
3. Copie o **Host** correto (ex: `ftp.seudominio.com`)
4. Atualize no `.env`

---

### ❌ Tarefa agendada não executa

**Checklist**:

- [ ] Marcou "Executar estando o usuário conectado ou não"?
- [ ] Forneceu credenciais do Windows ao salvar?
- [ ] O caminho do `executar.bat` está correto?
- [ ] O campo "Iniciar em" está preenchido?

---

## 📊 FORMATO DOS ARQUIVOS GERADOS

```
LOJA_01_AFD_2025-10-28_14-30-25.txt
│       │         │  │  │  │
│       │         │  │  │  └─ Segundos
│       │         │  │  └──── Minutos
│       │         │  └──────── Horas
│       │         └────────────── Data
│       └─────────────────────────── "AFD"
└────────────────────────────────────── ID Máquina
```

Arquivos são salvos em: `/public_html/pontos/` na Hostinger

---

## 🔄 FLUXO COMPLETO

```
┌──────────────────────────┐
│  Relógio Henry           │
│  http://192.168.15.10    │
└──────────┬───────────────┘
           │
           │ 1. Script acessa
           │ 2. Faz login
           │ 3. Clica em "Exportar AFD"
           │ 4. Baixa arquivo
           ▼
┌──────────────────────────┐
│  Pasta Temporária        │
│  C:\Users\...\Temp\      │
└──────────┬───────────────┘
           │
           │ 5. Renomeia arquivo
           │ 6. Prepara upload
           ▼
┌──────────────────────────┐
│  Servidor Hostinger      │
│  ftp.rederwp.com         │
│  /public_html/pontos/    │
└──────────────────────────┘
```

**Frequência**: A cada 10 minutos (24h por dia, 7 dias por semana)

---

## 💡 DICAS

### Ver O Que O Script Está Fazendo

Por padrão, o navegador roda em modo headless (invisível).

Para **ver** o que está acontecendo, edite o `index.js`:

```javascript
// Linha ~94, MUDE de:
headless: "new",

// PARA:
headless: false,
```

Agora verá o Chrome abrindo e fazendo login automaticamente!

### Ajustar Tempo de Espera

Se o relógio é lento, aumente os timeouts:

```javascript
// Linha ~123
await page.waitForTimeout(2000); // <- Aumente para 5000 (5 segundos)
```

### Múltiplas Lojas

Cada loja precisa de:

1. Seu próprio arquivo `.env` com `MACHINE_ID` único
2. Sua própria tarefa agendada no Windows
3. Exemplo:
   - Loja 01: `MACHINE_ID="LOJA_01"`
   - Loja 02: `MACHINE_ID="LOJA_02"`

---

## 📁 ESTRUTURA DO PROJETO

```
owl-ponto/
├── index.js           # Script principal (Puppeteer + FTP)
├── executar.bat       # Executável Windows
├── package.json       # Dependências (Puppeteer, FTP, dotenv)
├── env.example        # Exemplo de configuração
├── .env               # Suas credenciais (criar/não versionar)
└── README.md          # Este arquivo
```

---

## 🎓 COMANDOS ÚTEIS

```bash
# Instalar dependências
npm install

# Executar script
npm start

# Ou diretamente
node index.js

# Ver versão do Node.js
node --version

# Ver se Puppeteer foi instalado
npm list puppeteer
```

---

## 🔐 SEGURANÇA

- ✅ **NUNCA** compartilhe o arquivo `.env` (contém senhas)
- ✅ Adicione `.env` ao `.gitignore` se usar Git
- ✅ Use senhas fortes
- ✅ Mantenha o Node.js atualizado

---

## ⚙️ REQUISITOS DO SISTEMA

**Mínimo**:

- Windows 7 ou superior
- 2 GB RAM
- 500 MB espaço em disco (para Puppeteer/Chrome)
- Node.js 14+ instalado
- Conexão com internet

**Recomendado**:

- Windows 10/11
- 4 GB RAM
- 1 GB espaço em disco
- Node.js 20+ LTS

---

## 📞 SUPORTE

**Problemas comuns**: Veja seção "SOLUÇÃO DE PROBLEMAS" acima

**Logs**: O script mostra logs detalhados no console. Se algo falhar, leia as mensagens de erro.

**Testar manualmente**: Sempre teste com `npm start` antes de agendar no Windows.

---

## ✅ CHECKLIST FINAL

- [ ] Node.js instalado
- [ ] `npm install` executado (Puppeteer baixado)
- [ ] Arquivo `.env` criado e configurado
- [ ] Testado manualmente: `npm start` → ✅ Sucesso
- [ ] Arquivo apareceu na Hostinger
- [ ] Tarefa agendada no Windows criada
- [ ] Tarefa testada manualmente (Executar)
- [ ] Aguardou 10 minutos → novo arquivo apareceu

Se todos os itens estão ✅, o sistema está funcionando perfeitamente!

---

**Desenvolvido com 🦉 para automatizar coleta de ponto em relógios Henry**

---

## 🆕 VERSÃO

**v1.0.0** - Sistema completo com automação via Puppeteer

- Acesso automático ao relógio Henry
- Login automatizado
- Download de AFD do dia atual
- Upload para Hostinger
- Limpeza automática de arquivos temporários
