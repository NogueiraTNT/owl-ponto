# 🏪 GUIA DE INSTALAÇÃO NAS LOJAS

## 🎯 Sistema com Auto-Atualização

Este sistema **SE ATUALIZA SOZINHO**! Toda vez que você fizer uma alteração no GitHub e sincronizar, **todas as lojas receberão a atualização automaticamente** na próxima execução.

---

## 📦 INSTALAÇÃO EM CADA LOJA (Apenas 1ª Vez)

### Pré-requisitos:

- ✅ Node.js instalado (https://nodejs.org/)
- ✅ Git instalado (https://git-scm.com/)
- ✅ Acesso à internet na loja

---

### 🔧 PASSO A PASSO

#### 1️⃣ Clonar o Repositório

Abra o PowerShell ou CMD na loja:

```bash
# Navegue até onde quer instalar (ex: C:\Apps\)
cd C:\

# Clone o repositório
git clone https://github.com/SEU_USUARIO/owl-ponto.git

# Entre na pasta
cd owl-ponto
```

#### 2️⃣ Instalar Dependências

```bash
npm install
```

⏳ Aguarde ~5 minutos (baixa o Puppeteer/Chrome ~200MB)

#### 3️⃣ Configurar Credenciais

1. **Copie** o arquivo `env.example` e renomeie para `.env`
2. **Edite** o `.env` com as credenciais **DESTA LOJA**:

```ini
# Configuração específica desta loja
RELOGIO_URL="http://192.168.15.10"
RELOGIO_USER="admin"
RELOGIO_PASS="senha_desta_loja"

# Hostinger (mesmo para todas as lojas)
HOSTINGER_FTP_HOST="ftp.rederwp.com"
HOSTINGER_FTP_USER="u504951644"
HOSTINGER_FTP_PASS="sua_senha_ftp"
HOSTINGER_REMOTE_FOLDER_PATH="/public_html/pontos/"

# ID ÚNICO desta loja (IMPORTANTE!)
MACHINE_ID="LOJA_01"  # ← Mude para: LOJA_02, LOJA_03, etc
```

**⚠️ IMPORTANTE**: Cada loja precisa de um `MACHINE_ID` único!

#### 4️⃣ Testar

```bash
npm start
```

Resultado esperado:

```
========================================
🔄 VERIFICANDO ATUALIZAÇÕES...
========================================
✅ Já está na versão mais recente!

========================================
▶️  INICIANDO PROCESSO ETL...
========================================
✅ ETL CONCLUÍDO COM SUCESSO!
```

#### 5️⃣ Agendar no Windows

Agora configure no **Agendador de Tarefas** para rodar automaticamente:

1. `Win + R` → `taskschd.msc`
2. Criar Tarefa...
3. **Nome**: `OWL-PONTO ETL - LOJA 01`
4. **Ações**:
   - Programa: `C:\owl-ponto\executar.bat`
   - Iniciar em: `C:\owl-ponto`
5. **Gatilhos**: A cada 10 minutos
6. **Condições**:
   - ❌ Desmarcar "Iniciar apenas se conectado à energia CA"
7. **Configurações**:
   - ✅ Marcar "Permitir execução sob demanda"
   - ✅ Marcar "Executar tarefa assim que possível se perdida"

---

## 🔄 COMO O SISTEMA DE AUTO-ATUALIZAÇÃO FUNCIONA

### A cada execução (a cada 10 minutos):

```
1. 🔍 Verifica se há atualizações no GitHub
2. 📥 Se houver, baixa automaticamente
3. 💾 Faz backup do .env (suas configurações)
4. 🔄 Aplica as atualizações
5. 📦 Instala novas dependências (se houver)
6. ✅ Restaura o .env
7. 🚀 Executa o ETL normalmente
```

**Resultado**: Você atualiza o código no GitHub → Todas as lojas recebem em até 10 minutos!

---

## 🎯 FLUXO DE ATUALIZAÇÃO

### No Escritório (Você):

```bash
# Fez uma correção no código
git add .
git commit -m "Corrigido problema X"
git push origin main
```

### Nas Lojas (Automático):

```
⏰ 10:00 - Executou ETL (versão antiga)
⏰ 10:10 - Detectou atualização no GitHub
           ↓ Baixou e aplicou
           ↓ Executou ETL (versão NOVA!) ✅
⏰ 10:20 - Executou ETL (versão nova)
```

**Zero intervenção manual!** 🎉

---

## 📊 EXEMPLO: Múltiplas Lojas

| Loja    | IP Relógio    | MACHINE_ID | Pasta Instalação |
| ------- | ------------- | ---------- | ---------------- |
| Loja 01 | 192.168.15.10 | LOJA_01    | C:\owl-ponto     |
| Loja 02 | 192.168.15.11 | LOJA_02    | C:\owl-ponto     |
| Loja 03 | 192.168.15.12 | LOJA_03    | C:\owl-ponto     |
| Matriz  | 192.168.10.20 | MATRIZ_01  | C:\owl-ponto     |

Todos os arquivos vão para: `/public_html/pontos/` na Hostinger

Exemplos de arquivos gerados:

```
LOJA_01_AFD_2025-10-28_14-30-25.txt
LOJA_02_AFD_2025-10-28_14-31-10.txt
LOJA_03_AFD_2025-10-28_14-32-05.txt
MATRIZ_01_AFD_2025-10-28_14-33-50.txt
```

---

## 🆘 PROBLEMAS COMUNS

### ❌ "fatal: not a git repository"

**Causa**: Não clonou via Git

**Solução**:

```bash
# Na pasta do projeto
git init
git remote add origin https://github.com/SEU_USUARIO/owl-ponto.git
git pull origin main
```

### ❌ "Updates were rejected"

**Causa**: Modificou arquivos localmente

**Solução**:

```bash
# Descartar mudanças locais e forçar atualização
git reset --hard origin/main
```

### ❌ Atualização não detecta mudanças

**Verifique**:

1. A loja tem internet? (`ping github.com`)
2. O Git está configurado? (`git remote -v`)
3. O branch está correto? (`git branch` → deve mostrar `main`)

---

## 🔐 SEGURANÇA

**O arquivo `.env` NUNCA é sobrescrito** pelas atualizações!

- ✅ `.env` → **Ignorado pelo Git** (configurações locais preservadas)
- ✅ Backup automático antes de qualquer atualização
- ✅ Restauração automática após atualização

---

## 💡 COMANDOS ÚTEIS

```bash
# Testar manualmente
npm start

# Apenas verificar atualizações (sem executar ETL)
npm run update

# Executar ETL sem verificar atualizações
npm run etl

# Ver versão atual do Git
git log -1

# Forçar atualização
git pull origin main

# Ver status do repositório
git status
```

---

## 📝 CHECKLIST DE INSTALAÇÃO

- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Repositório clonado (`git clone ...`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] `MACHINE_ID` único definido
- [ ] Testado manualmente (`npm start`) → ✅ Sucesso
- [ ] Arquivo apareceu na Hostinger
- [ ] Tarefa agendada no Windows criada
- [ ] Tarefa testada manualmente
- [ ] Aguardou 10 minutos → nova execução automática ✅

---

## 🎉 PRONTO!

Agora você tem:

- ✅ Sistema instalado na loja
- ✅ Auto-atualização funcionando
- ✅ ETL executando a cada 10 minutos
- ✅ Arquivos sendo enviados para Hostinger

**Sempre que fizer uma mudança no GitHub, todas as lojas receberão em até 10 minutos!** 🚀

---

**Desenvolvido com 🦉 para facilitar a gestão de múltiplas lojas**
