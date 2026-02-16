# Integración de Navegación con Apps Nativas

## 📱 Resumen de Cambios

Se ha implementado la funcionalidad para abrir apps nativas de navegación (Waze y Google Maps/Apple Maps) desde el webview de la aplicación APEGWV.

## ✅ Cambios Realizados

### 1. **TypeScript - Definición de Tipos** (`window.d.ts`)
- ✅ Agregada función `openExternalURL?: (url: string) => void` al interface `iOSNative`
- Esta función permite abrir URLs externas desde el JavaScript del webview

### 2. **React - Páginas Web** (`GreenFee.tsx` y `CourseReservation.tsx`)

#### Modal de Navegación
- ✅ **Posición mejorada**: El modal ahora aparece centrado en la pantalla (`alignItems: 'center'`)
- ✅ **Animación actualizada**: Cambio de slide-up a scale/fade para mejor UX
- ✅ **Diseño mejorado**: Border radius completo (32px) en lugar de solo esquinas superiores

#### Botones de Navegación
- ✅ **Logo de Waze**: Reemplazado el ícono de flecha con el logo de Waze (`/images/waze.png`)
- ✅ **Detección de plataforma**: Los botones ahora detectan si están en iOS webview
- ✅ **URLs nativas**:
  - **Waze**: `waze://?q=<ubicación>` (app nativa) o fallback a web
  - **Apple Maps**: `https://maps.apple.com/?q=<ubicación>` (iOS) o Google Maps (web)

### 3. **Swift - WebView Bridge** (`WebView.swift`)

#### JavaScript Bridge
```javascript
openExternalURL: function(url) {
    window.webkit.messageHandlers.nativeBridge.postMessage({
        command: 'openExternalURL', 
        url: url
    });
}
```

#### Handler Swift
```swift
case "openExternalURL":
    if let urlString = dict["url"] as? String,
       let url = URL(string: urlString) {
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
```

## 🎯 Funcionamiento

### En iOS (Webview)
1. Usuario hace clic en botón de navegación
2. Se abre modal centrado con opciones
3. Usuario selecciona Waze o Maps
4. El webview llama a `window.iOSNative.openExternalURL(url)`
5. iOS abre la app nativa correspondiente:
   - `waze://?q=...` → Abre Waze
   - `https://maps.apple.com/?q=...` → Abre Apple Maps

### En Web (Navegador)
1. Usuario hace clic en botón de navegación
2. Se abre modal centrado con opciones
3. Usuario selecciona Waze o Maps
4. Se abre en nueva pestaña del navegador:
   - `https://waze.com/ul?q=...` → Waze Web
   - `https://www.google.com/maps/search/?api=1&query=...` → Google Maps Web

## 📂 Archivos Modificados

### TypeScript/React
- `/src/types/window.d.ts`
- `/src/pages/GreenFee.tsx`
- `/src/pages/CourseReservation.tsx`

### Swift
- `/APEGWV/APEGWV/WebView.swift`

### Assets
- `/public/images/waze.png` (logo de Waze)

## 🧪 Testing

### Para probar en iOS:
1. Compilar y ejecutar la app en dispositivo iOS
2. Navegar a la sección de Green Fee o Reservación de Campo
3. Hacer clic en el logo de Waze o botón "CÓMO LLEGAR"
4. Seleccionar Waze o Maps en el modal
5. Verificar que se abre la app nativa correspondiente

### Para probar en Web:
1. Ejecutar `npm run dev`
2. Abrir en navegador
3. Seguir los mismos pasos
4. Verificar que se abre en nueva pestaña del navegador

## 🎨 Mejoras de UI

- **Modal más accesible**: Centrado en pantalla en lugar de bottom sheet
- **Logo de Waze visible**: Reemplaza el ícono genérico de navegación
- **Animación suave**: Scale/fade en lugar de slide
- **Mejor contraste**: Fondo blanco semi-transparente para los logos

## 🔄 Próximos Pasos (Opcional)

- [ ] Agregar detección de apps instaladas antes de mostrar opciones
- [ ] Agregar más opciones de navegación (Uber, etc.)
- [ ] Implementar analytics para tracking de uso
- [ ] Agregar deep links personalizados para mejor integración
