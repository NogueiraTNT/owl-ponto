@echo off
REM ═══════════════════════════════════════════════════════════
REM 🦉 OWL-PONTO ETL - Executável Windows (com Auto-Update)
REM ═══════════════════════════════════════════════════════════

REM Navegar para o diretório do script
cd /d "%~dp0"

REM Executar o script com auto-atualização
node start.js

REM Sair com o código de erro apropriado
exit /b %ERRORLEVEL%

