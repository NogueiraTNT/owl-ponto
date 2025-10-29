@echo off
REM ═══════════════════════════════════════════════════════════
REM 🦉 OWL-PONTO ETL - Executável Windows
REM ═══════════════════════════════════════════════════════════

REM Navegar para o diretório do script
cd /d "%~dp0"

REM Executar o script Node.js
node index.js

REM Sair com o código de erro apropriado
exit /b %ERRORLEVEL%

