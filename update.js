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

    // Fazer backup do .env antes de atualizar
    if (fs.existsSync(".env")) {
      console.log("💾 Fazendo backup do .env...");
      fs.copyFileSync(".env", ".env.backup");
      console.log("✅ Backup criado: .env.backup\n");
    }

    // Buscar e aplicar atualizações (git pull)
    console.log("📡 Buscando atualizações do servidor...");
    const { stdout: pullOutput } = await execPromise("git pull origin main");
    console.log("📥 Resultado:");
    console.log(pullOutput);

    // Verificar se houve atualização
    if (
      pullOutput.includes("Already up to date") ||
      pullOutput.includes("Já atualizado")
    ) {
      console.log("\n✅ Já está na versão mais recente!\n");

      // Remover backup se não houve atualização
      if (fs.existsSync(".env.backup")) {
        fs.unlinkSync(".env.backup");
      }

      return { atualizado: false, motivo: "Já atualizado" };
    }

    console.log("\n📦 Atualizações detectadas e aplicadas!");

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

    return { atualizado: true };
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
