#!/bin/bash

# Script para actualizar dependencias para el soporte multimodal

echo "Actualizando dependencias para el soporte multimodal de Gemini 1.5 Pro..."

# Asegúrate de estar en el directorio del backend
cd "$(dirname "$0")/.."

# Instalar dependencias
npm install @google/generative-ai@0.2.1

echo "Verificando instalación de multer..."
if npm list multer | grep -q multer; then
    echo "multer ya está instalado."
else
    echo "Instalando multer para manejo de archivos..."
    npm install multer@1.4.5-lts.1
fi

echo "Instalación completada."
echo ""
echo "NOTA IMPORTANTE:"
echo "Esta actualización ya no requiere la variable de entorno GEMINI_API_KEY"
echo "en el backend. Los usuarios deben proporcionar su propia API Key a través"
echo "del frontend. Para más detalles, consulta los archivos:"
echo "- docs/MULTIMODAL_UPDATE.md"
echo "- docs/FRONTEND_INTEGRATION.md"
echo ""

exit 0
