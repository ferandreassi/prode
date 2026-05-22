#!/bin/bash
# Script to copy the generated premium PWA icon and generate all required device assets using sips.

echo "🎨 Generando iconos PWA Premium para PRODE..."

MASTER_SRC="/Users/fernandoandreassi/.gemini/antigravity-ide/brain/43e4fe3b-ecf3-4f1c-9c62-04b984e68759/prode_clean_icon_1779477576480.png"
PUBLIC_DIR="/Users/fernandoandreassi/Documents/GitHub/Prode/frontend/public"

# Verify source exists
if [ ! -f "$MASTER_SRC" ]; then
    echo "❌ Error: No se encontró la imagen maestra generada en la carpeta de la IA."
    exit 1
fi

# Copy master
cp "$MASTER_SRC" "$PUBLIC_DIR/pwa-512x512.png"
echo "✅ Copiado icono maestro high-res (512x512.png)"

# Resize using sips (macOS native tool)
sips -z 512 512 "$PUBLIC_DIR/pwa-512x512.png" > /dev/null

cp "$PUBLIC_DIR/pwa-512x512.png" "$PUBLIC_DIR/pwa-192x192.png"
sips -z 192 192 "$PUBLIC_DIR/pwa-192x192.png" > /dev/null
echo "✅ Generado pwa-192x192.png para Android/PWA"

cp "$PUBLIC_DIR/pwa-512x512.png" "$PUBLIC_DIR/apple-touch-icon.png"
sips -z 180 180 "$PUBLIC_DIR/apple-touch-icon.png" > /dev/null
echo "✅ Generado apple-touch-icon.png (180x180) para iOS"

cp "$PUBLIC_DIR/pwa-512x512.png" "$PUBLIC_DIR/favicon.png"
sips -z 32 32 "$PUBLIC_DIR/favicon.png" > /dev/null
echo "✅ Generado favicon.png (32x32) para pestaña del navegador"

echo "🎉 ¡Todos los iconos PWA se han generado con éxito!"
