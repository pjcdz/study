@echo off
REM Script para actualizar dependencias para el soporte multimodal

echo Actualizando dependencias para el soporte multimodal de Gemini 1.5 Pro...

REM Navegar al directorio del backend
cd %~dp0\..

REM Instalar dependencias
call npm install @google/generative-ai@0.2.1

echo Verificando instalacion de multer...
call npm list multer | findstr "multer"
if %ERRORLEVEL% EQU 0 (
    echo multer ya esta instalado.
) else (
    echo Instalando multer para manejo de archivos...
    call npm install multer@1.4.5-lts.1
)

echo Instalacion completada.
echo.
echo NOTA IMPORTANTE:
echo Esta actualizacion ya no requiere la variable de entorno GEMINI_API_KEY
echo en el backend. Los usuarios deben proporcionar su propia API Key a traves
echo del frontend. Para mas detalles, consulta los archivos:
echo - docs/MULTIMODAL_UPDATE.md
echo - docs/FRONTEND_INTEGRATION.md
echo.

pause
