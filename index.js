const puppeteer = require("puppeteer");
const ftp = require("basic-ftp");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Carregar variáveis de ambiente
dotenv.config();

/**
 * 🦉 OWL-PONTO ETL - Script Completo
 *
 * 1. Acessa o relógio Henry via navegador (Puppeteer)
 * 2. Faz login automático
 * 3. Baixa o arquivo AFD do dia atual
 * 4. Renomeia com ID único + timestamp
 * 5. Faz upload para servidor Hostinger via FTP
 */

/**
 * Gera timestamp formatado
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Valida variáveis de ambiente
 */
function validateEnvVariables() {
  const requiredVars = [
    "RELOGIO_URL",
    "RELOGIO_USER",
    "RELOGIO_PASS",
    "HOSTINGER_FTP_HOST",
    "HOSTINGER_FTP_USER",
    "HOSTINGER_FTP_PASS",
    "HOSTINGER_REMOTE_FOLDER_PATH",
    "MACHINE_ID",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(
      "❌ ERRO: Variáveis de ambiente obrigatórias não encontradas:"
    );
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error(
      "\nVerifique se o arquivo .env existe e está configurado corretamente."
    );
    process.exit(1);
  }
}

/**
 * Baixa o AFD do relógio Henry via navegador automatizado
 */
async function baixarAFDDoRelogio() {
  console.log("========================================");
  console.log("📥 ETAPA 1: EXTRACT - Download do Relógio");
  console.log("========================================\n");

  const downloadPath = path.join(os.tmpdir(), "owl-ponto-downloads");

  // Criar pasta de downloads temporária
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  console.log(`🌐 Acessando: ${process.env.RELOGIO_URL}`);
  console.log(`👤 Usuário: ${process.env.RELOGIO_USER}`);
  console.log(`📁 Pasta temporária: ${downloadPath}\n`);

  let browser;
  let downloadedFile = null;

  try {
    // Iniciar navegador
    console.log("🚀 Iniciando navegador...");
    browser = await puppeteer.launch({
      headless: true, // false = você vê o navegador (útil para debug)
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // Configurar downloads
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    console.log("✅ Navegador iniciado!");

    // Acessar o relógio
    console.log("\n🔌 Conectando ao relógio...");
    await page.goto(process.env.RELOGIO_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Página carregada!");

    // Aguardar um pouco para a página carregar completamente
    await page.waitForTimeout(2000);

    // Tentar fazer login (ajuste os seletores conforme seu relógio Henry)
    console.log("\n🔐 Fazendo login...");

    try {
      // Tenta encontrar campos de usuário e senha
      // NOTA: Esses seletores podem variar dependendo do modelo do Henry
      // Você pode precisar ajustar isso inspecionando a página do seu relógio

      // Seletores específicos do seu relógio Henry
      const usernameSelector = "#lblLogin"; // ID do campo usuário
      const passwordSelector = "#lblPass"; // ID do campo senha
      const loginButtonSelector = "a.button.primary"; // Link "Entrar"

      // Preencher usuário
      await page.waitForSelector(usernameSelector, { timeout: 5000 });
      await page.type(usernameSelector, process.env.RELOGIO_USER);
      console.log("  ✓ Usuário preenchido");

      // Preencher senha
      await page.type(passwordSelector, process.env.RELOGIO_PASS);
      console.log("  ✓ Senha preenchida");

      // Clicar em login
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }),
        page.click(loginButtonSelector),
      ]);

      console.log("✅ Login realizado com sucesso!");
    } catch (loginError) {
      console.log("⚠️  Login automático falhou. Tentando continuar...");
      console.log(`   Detalhes: ${loginError.message}`);
    }

    // Aguardar após login
    await page.waitForTimeout(3000);

    // ===== PASSO 1: Clicar em "Eventos" =====
    console.log("\n📄 PASSO 1: Procurando menu 'Eventos'...");

    try {
      // Clicar no tile "Eventos" - ID EXATO do seu relógio
      const eventosDiv = await page.waitForSelector("#divMenuEvents", {
        timeout: 5000,
      });
      await eventosDiv.click();
      console.log(`  ✓ Clicou em 'Eventos' (#divMenuEvents)`);

      await page.waitForTimeout(3000); // Aguardar carregar

      // ===== PASSO 2: Clicar na aba "Filtro por data/hora" =====
      console.log("\n📄 PASSO 2: Clicando na aba 'Filtro por data/hora'...");

      const abaFiltro = await page.waitForSelector("#menuItem2", {
        timeout: 5000,
      });
      await abaFiltro.click();
      console.log("  ✓ Clicou na aba 'Filtro por data/hora' (#menuItem2)");

      await page.waitForTimeout(2000); // Aguardar a aba mudar

      // ===== PASSO 3: Preencher datas =====
      console.log("\n📄 PASSO 3: Preenchendo datas (últimas 24 horas)...");

      // Calcular período de 24 horas baseado no horário atual
      // Se executado às 2:30 → puxar de 2:31 do dia anterior até 2:29 de hoje
      const agora = new Date();

      // Data/Hora Final: 1 minuto antes do horário atual
      const dataHoraFinal = new Date(agora.getTime() - 60000); // -1 minuto

      // Data/Hora Inicial: 24 horas antes da final + 1 minuto
      const dataHoraInicial = new Date(
        dataHoraFinal.getTime() - 24 * 60 * 60 * 1000 + 60000
      ); // -24h +1min

      // Formatar para DD/MM/YY HH:MM
      const formatarData = (data) => {
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = String(data.getFullYear()).substring(2);
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
      };

      const dataInicial = formatarData(dataHoraInicial);
      const dataFinal = formatarData(dataHoraFinal);

      console.log(`  ⏰ Horário de execução: ${formatarData(agora)}`);
      console.log(`  📅 Data Inicial: ${dataInicial}`);
      console.log(`  📅 Data Final: ${dataFinal}`);

      // Preencher campo "Inicial" - ID EXATO do seu relógio
      console.log(`  🔧 Limpando e preenchendo campo 'Inicial'...`);
      await page.evaluate(() => {
        document.getElementById("lblDataI").value = "";
      });
      const campoInicial = await page.waitForSelector("#lblDataI", {
        timeout: 5000,
      });
      await campoInicial.click();
      await campoInicial.type(dataInicial);
      console.log(`  ✓ Campo 'Inicial' preenchido: ${dataInicial} (#lblDataI)`);

      await page.waitForTimeout(500);

      // Preencher campo "Final" - ID EXATO do seu relógio
      console.log(`  🔧 Limpando e preenchendo campo 'Final'...`);
      await page.evaluate(() => {
        document.getElementById("lblDataF").value = "";
      });
      const campoFinal = await page.waitForSelector("#lblDataF", {
        timeout: 5000,
      });
      await campoFinal.click();
      await campoFinal.type(dataFinal);
      console.log(`  ✓ Campo 'Final' preenchido: ${dataFinal} (#lblDataF)`);

      await page.waitForTimeout(1000);

      // ===== PASSO 4: Clicar em "Baixar Dados" =====
      console.log("\n📄 PASSO 4: Clicando em 'Baixar Dados'...");

      // OPÇÃO 1: Executar o JavaScript diretamente (mais confiável!)
      try {
        console.log("  🔧 Executando downloadData(1,32,2) via JavaScript...");
        await page.evaluate(() => {
          // Chama a função JavaScript diretamente
          downloadData(1, 32, 2);
        });
        console.log(`  ✓ Comando de download executado com sucesso!`);
      } catch (jsError) {
        console.log(`  ⚠️  JavaScript direto falhou: ${jsError.message}`);
        console.log(`  🔧 Tentando clicar no botão...`);

        // OPÇÃO 2: Tentar clicar no botão (fallback)
        const baixarButton = await page.$x(
          "//a[contains(@onclick, 'downloadData')]"
        );

        if (baixarButton.length > 0) {
          // Garantir que o elemento está visível e clicável
          await baixarButton[0].evaluate((el) => el.scrollIntoView());
          await page.waitForTimeout(500);
          await baixarButton[0].click();
          console.log(`  ✓ Clicou em 'Baixar Dados' (XPath)`);
        } else {
          throw new Error(
            "Não foi possível executar download de nenhuma forma"
          );
        }
      }

      // Aguardar o download iniciar
      console.log("\n⏳ Aguardando download do arquivo...");
      await page.waitForTimeout(5000);

      // Verificar se algum arquivo foi baixado
      const files = fs.readdirSync(downloadPath);
      const afdFiles = files.filter(
        (f) =>
          f.toLowerCase().includes("afd") ||
          f.toLowerCase().includes("event") ||
          f.toLowerCase().includes("dados") ||
          f.endsWith(".txt") ||
          f.endsWith(".dat") ||
          f.endsWith(".csv")
      );

      if (afdFiles.length > 0) {
        downloadedFile = path.join(downloadPath, afdFiles[0]);
        const stats = fs.statSync(downloadedFile);
        console.log(`✅ Arquivo baixado: ${afdFiles[0]}`);
        console.log(`📊 Tamanho: ${stats.size} bytes`);
      } else {
        throw new Error("Nenhum arquivo foi baixado");
      }
    } catch (afdError) {
      throw new Error(`Erro ao baixar AFD: ${afdError.message}`);
    }
  } catch (error) {
    throw new Error(`Falha no download do relógio: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔌 Navegador fechado.");
    }
  }

  return downloadedFile;
}

/**
 * Função principal do ETL
 */
async function runETL() {
  let tempFilePath = null;
  let downloadPath = null;

  try {
    console.log("========================================");
    console.log("🦉 OWL PONTO - SCRIPT ETL INICIADO");
    console.log("========================================\n");
    console.log(`⏰ Data/Hora: ${new Date().toLocaleString("pt-BR")}`);
    console.log(`🏪 Máquina: ${process.env.MACHINE_ID}\n`);

    // 1. Validar configurações
    console.log("📋 Validando configurações...");
    validateEnvVariables();
    console.log("✅ Configurações validadas!\n");

    // 2. Gerar timestamp e nome do arquivo
    const timestamp = generateTimestamp();
    const newFileName = `${process.env.MACHINE_ID}_AFD_${timestamp}.txt`;
    console.log(`📝 Nome do arquivo: ${newFileName}\n`);

    // 3. Baixar AFD do relógio via navegador
    downloadPath = await baixarAFDDoRelogio();

    if (!downloadPath || !fs.existsSync(downloadPath)) {
      throw new Error("Arquivo AFD não foi baixado corretamente");
    }

    // 4. Copiar para arquivo temporário com novo nome
    tempFilePath = path.join(os.tmpdir(), `temp_afd_${timestamp}.txt`);
    fs.copyFileSync(downloadPath, tempFilePath);

    // ===== ETAPA 2: TRANSFORM =====
    console.log("\n========================================");
    console.log("🔄 ETAPA 2: TRANSFORM - Renomeação");
    console.log("========================================");
    console.log(`✅ Arquivo renomeado para: ${newFileName}\n`);

    // ===== ETAPA 3: LOAD (Upload para Hostinger) =====
    console.log("========================================");
    console.log("📤 ETAPA 3: LOAD - Upload para Hostinger");
    console.log("========================================\n");

    const hostingerClient = new ftp.Client();
    hostingerClient.ftp.verbose = false;

    try {
      console.log(
        `🔌 Conectando ao servidor Hostinger em ${process.env.HOSTINGER_FTP_HOST}...`
      );
      await hostingerClient.access({
        host: process.env.HOSTINGER_FTP_HOST,
        user: process.env.HOSTINGER_FTP_USER,
        password: process.env.HOSTINGER_FTP_PASS,
        secure: false,
      });
      console.log("✅ Conectado à Hostinger!");

      // Garantir que o diretório existe
      console.log(
        `📁 Navegando para: ${process.env.HOSTINGER_REMOTE_FOLDER_PATH}...`
      );
      try {
        await hostingerClient.ensureDir(
          process.env.HOSTINGER_REMOTE_FOLDER_PATH
        );
      } catch (error) {
        console.log("⚠️  Não foi possível criar/verificar diretório.");
      }

      const remotePath = `${process.env.HOSTINGER_REMOTE_FOLDER_PATH}${newFileName}`;
      console.log(`📤 Fazendo upload para: ${remotePath}...`);
      await hostingerClient.uploadFrom(tempFilePath, remotePath);
      console.log("✅ Upload concluído com sucesso!");
    } catch (error) {
      throw new Error(`Falha no upload para Hostinger: ${error.message}`);
    } finally {
      hostingerClient.close();
      console.log("🔌 Conexão com a Hostinger encerrada.\n");
    }

    // ===== FINALIZAÇÃO =====
    console.log("========================================");
    console.log("✅ ETL CONCLUÍDO COM SUCESSO!");
    console.log("========================================");
    console.log(`📁 Arquivo: ${newFileName}`);
    console.log(`⏰ Concluído em: ${new Date().toLocaleString("pt-BR")}`);
    console.log("========================================\n");

    // Limpar arquivos temporários
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (downloadPath && fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }

    // Limpar pasta de downloads
    const downloadDir = path.join(os.tmpdir(), "owl-ponto-downloads");
    if (fs.existsSync(downloadDir)) {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }

    console.log("🧹 Arquivos temporários removidos.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ ERRO NO PROCESSO ETL");
    console.error("========================================");
    console.error(`Erro: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error("========================================\n");

    // Limpar em caso de erro
    try {
      if (tempFilePath && fs.existsSync(tempFilePath))
        fs.unlinkSync(tempFilePath);
      if (downloadPath && fs.existsSync(downloadPath))
        fs.unlinkSync(downloadPath);
      const downloadDir = path.join(os.tmpdir(), "owl-ponto-downloads");
      if (fs.existsSync(downloadDir))
        fs.rmSync(downloadDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(`⚠️  Erro na limpeza: ${cleanupError.message}`);
    }

    process.exit(1);
  }
}

// Executar

runETL();

// apenas um teste te atualização 3
