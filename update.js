const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");

const execPromise = promisify(exec);

/**
 * 🔄 OWL-PONTO - Sistema de Auto-Atualização
 *
 * Verifica se há atualizações no repositório Git
 * e aplica automaticamente antes de executar o ETL
 */

async function verificarAtualizacoes() {
  console.log("========================================");
  console.log("🔄 VERIFICANDO ATUALIZAÇÕES...");
  console.log("========================================\n");

  try {
    // Verificar se está em um repositório Git
    if (!fs.existsSync(".git")) {
      console.log("⚠️  Não é um repositório Git. Pulando atualização...\n");
      return { atualizado: false, motivo: "Não é repositório Git" };
    }

    // Buscar atualizações do remoto
    console.log("📡 Buscando atualizações do servidor...");
    await execPromise("git fetch origin");
    console.log("✅ Atualizações verificadas!\n");

    // Verificar se há commits novos
    console.log("🔍 Verificando se há mudanças...");
    const { stdout: status } = await execPromise(
      "git rev-list HEAD...origin/main --count"
    );
    const commitsAtras = parseInt(status.trim(), 10);

    if (commitsAtras === 0) {
      console.log("✅ Já está na versão mais recente!\n");
      return { atualizado: false, motivo: "Já atualizado" };
    }

    console.log(`📦 ${commitsAtras} atualização(ões) disponível(eis)!`);
    console.log("⬇️  Baixando atualizações...\n");

    // Fazer backup do .env antes de atualizar
    if (fs.existsSync(".env")) {
      console.log("💾 Fazendo backup do .env...");
      fs.copyFileSync(".env", ".env.backup");
      console.log("✅ Backup criado: .env.backup\n");
    }

    // Aplicar atualizações (git pull)
    const { stdout: pullOutput } = await execPromise("git pull origin main");
    console.log("📥 Atualizações aplicadas:");
    console.log(pullOutput);

    // Restaurar .env se foi modificado
    if (fs.existsSync(".env.backup")) {
      console.log("\n🔄 Restaurando configurações locais (.env)...");
      fs.copyFileSync(".env.backup", ".env");
      fs.unlinkSync(".env.backup");
      console.log("✅ Configurações restauradas!\n");
    }

    // Verificar se package.json mudou
    if (pullOutput.includes("package.json")) {
      console.log("📦 Detectadas mudanças nas dependências!");
      console.log("⬇️  Instalando/atualizando pacotes...\n");

      const { stdout: npmOutput } = await execPromise("npm install");
      console.log(npmOutput);
      console.log("✅ Dependências atualizadas!\n");
    }

    console.log("========================================");
    console.log("✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("========================================\n");

    return { atualizado: true, commits: commitsAtras };
  } catch (error) {
    console.error("\n========================================");
    console.error("⚠️  ERRO AO VERIFICAR ATUALIZAÇÕES");
    console.error("========================================");
    console.error(`Erro: ${error.message}`);
    console.error("\n⚠️  Continuando com a versão atual...\n");

    return { atualizado: false, erro: error.message };
  }
}

// Se executado diretamente
if (require.main === module) {
  verificarAtualizacoes()
    .then((resultado) => {
      if (resultado.atualizado) {
        console.log("🎉 Sistema atualizado com sucesso!");
        process.exit(0);
      } else {
        console.log("ℹ️  Nenhuma atualização aplicada.");
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("❌ Erro:", error.message);
      process.exit(1);
    });
}

module.exports = { verificarAtualizacoes };
