const { verificarAtualizacoes } = require("./update");
const { spawn } = require("child_process");

/**
 * 🦉 OWL-PONTO - Script de Inicialização
 *
 * 1. Verifica e aplica atualizações
 * 2. Executa o ETL
 */

async function iniciar() {
  try {
    // ETAPA 1: Verificar e aplicar atualizações
    const resultado = await verificarAtualizacoes();

    if (resultado.atualizado) {
      console.log("🔄 Sistema foi atualizado. Reiniciando...\n");

      // Se foi atualizado, reiniciar o script para usar a nova versão
      const novoProcesso = spawn(process.execPath, ["start.js"], {
        detached: true,
        stdio: "inherit",
      });

      novoProcesso.unref();
      process.exit(0);
      return;
    }

    // ETAPA 2: Executar o ETL
    console.log("========================================");
    console.log("▶️  INICIANDO PROCESSO ETL...");
    console.log("========================================\n");

    // Importar e executar o ETL
    require("./index");
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ ERRO NO PROCESSO DE INICIALIZAÇÃO");
    console.error("========================================");
    console.error(`Erro: ${error.message}`);
    console.error("========================================\n");
    process.exit(1);
  }
}

// Executar
iniciar();
