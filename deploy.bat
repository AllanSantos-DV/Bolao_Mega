@echo off
echo ========================================
echo    DEPLOY SISTEMA DE BOLOES
echo ========================================
echo.

REM Gerar timestamp para versioning
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "VERSION=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

echo Versao gerada: %VERSION%
echo.

REM Adicionar todos os arquivos
git add .

REM Commit com timestamp
git commit -m "Deploy v%VERSION% - Cache busting implementado"

REM Push para GitHub Pages
git push origin main

echo.
echo ========================================
echo    DEPLOY CONCLUIDO!
echo    Versao: %VERSION%
echo    URL: https://allansantos-dv.github.io/Bolao_Mega/
echo ========================================
pause
