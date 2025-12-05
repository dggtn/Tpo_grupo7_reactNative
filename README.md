# Ritmo Fit - Aplicación de Gestión de Clases de Gimnasio

## 📱 Descripción

Ritmo Fit es una aplicación móvil desarrollada con React Native y Expo que permite a los usuarios gestionar sus reservas de clases de gimnasio, realizar check-in mediante códigos QR, y recibir notificaciones push sobre sus clases programadas.

## 🚀 Características Principales

- **Autenticación Segura**: Login con email/contraseña y autenticación biométrica (huella digital/Face ID/PIN)
- **Gestión de Reservas**: Reserva y cancela clases de diferentes disciplinas
- **Check-in con QR**: Escaneo de códigos QR para registrar asistencia
- **Notificaciones Push**: Recordatorios automáticos 1 hora antes de cada clase
- **Long Polling**: Sistema de notificaciones en tiempo real para actualizaciones de clases
- **Perfil de Usuario**: Gestión de datos personales y foto de perfil
- **Historial**: Registro completo de asistencias y calificaciones
- **Recuperación de Contraseña**: Sistema completo de restablecimiento de contraseña

## 🛠️ Stack Tecnológico

- **React Native** (Expo)
- **Redux Toolkit** + **Redux Persist** (Gestión de estado)
- **Expo Router** (Navegación)
- **React Native Paper** (UI Components)
- **Expo Camera** (Escaneo QR)
- **Expo Notifications** (Notificaciones Push)
- **Expo Local Authentication** (Biometría)
- **Expo Secure Store** (Almacenamiento seguro)
- **React Native Maps** (Mapas)

## 📋 Requisitos Previos

### Software Necesario

1. **Node.js** (v16 o superior)
   ```bash
   node --version
   ```

2. **npm** o **yarn**
   ```bash
   npm --version
   # o
   yarn --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Android Studio** (para development builds)
   - Descargar desde: https://developer.android.com/studio
   - Instalar Android SDK Platform 33 (Android 13)
   - Configurar variable de entorno `ANDROID_HOME`

5. **EAS CLI** (Expo Application Services)
   ```bash
   npm install -g eas-cli
   ```

### Dispositivo Android

- Android 8.0 (API 26) o superior
- Modo de desarrollador activado
- Depuración USB habilitada
- Cable USB para conexión

## 🔧 Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd ritmo-fit-app
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8080
```

**⚠️ IMPORTANTE**: Reemplaza `TU_IP_LOCAL` con tu IP local real. Ejemplo:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

Para encontrar tu IP local:

**Windows:**
```bash
ipconfig
# Buscar "Dirección IPv4"
```

**Linux/Mac:**
```bash
ifconfig
# o
ip addr show
```

### 4. Configurar el Backend

Asegúrate de que el backend esté corriendo en:
```
http://TU_IP_LOCAL:8080
```

El backend debe estar accesible desde tu red local.

## 📱 Instalación en Dispositivo Android

### Opción 1: Development Build (Recomendado)

#### A. Primera Configuración

1. **Iniciar sesión en Expo**
   ```bash
   eas login
   ```

2. **Configurar el proyecto**
   ```bash
   eas build:configure
   ```

3. **Crear Development Build**
   ```bash
   eas build --profile development --platform android
   ```

   Opciones durante el build:
   - Generate a new keystore: **Yes**
   - What would you like your Android application id to be?: `com.tuempresa.ritmofit`

4. **Descargar e instalar el APK**
   - Una vez completado el build, recibirás un link
   - Descarga el APK en tu dispositivo Android
   - Instala el APK (permitir instalación de fuentes desconocidas)

#### B. Ejecutar la App

1. **Conectar dispositivo por USB**
   ```bash
   adb devices
   # Debes ver tu dispositivo listado
   ```

2. **Iniciar el servidor de desarrollo**
   ```bash
   npx expo start --dev-client
   ```

3. **Abrir en el dispositivo**
   - Presiona `a` en la terminal para abrir en Android
   - O escanea el QR con la app de Expo Go

### Opción 2: Expo Go (Limitaciones)

**⚠️ NOTA**: Algunas funcionalidades requieren development build:
- Notificaciones en background
- Autenticación biométrica avanzada
- Canales personalizados de Android

```bash
# Instalar Expo Go desde Play Store
# Luego ejecutar:
npx expo start
# Escanear QR con Expo Go
```

## 🔐 Configuración de Permisos en Android

La app requiere los siguientes permisos:

1. **Notificaciones**: Para recordatorios de clases
2. **Cámara**: Para escaneo de códigos QR
3. **Biometría/PIN**: Para login rápido y seguro

### Activar Permisos Manualmente

Si los permisos no funcionan:

1. Ir a **Configuración** > **Aplicaciones**
2. Buscar **Ritmo Fit**
3. **Permisos** > Activar:
   - Cámara
   - Notificaciones (permitir todas)
4. **Notificaciones** > Configurar:
   - "Notificaciones Principales": Prioridad **Alta**
   - "Notificaciones Urgentes": Prioridad **Urgente**

## 🎯 Flujo de Uso de la Aplicación

### 1. Registro e Inicio de Sesión

#### Primer Uso - Registro
1. Abrir la app
2. Tocar **"Regístrate"**
3. Ingresar email y contraseña
4. Tocar **"Enviar Código"**
5. Revisar email y copiar el código de 4 dígitos
6. Ingresar código en la pantalla de verificación
7. Tocar **"Verificar Código"**

**⏱️ Importante**: 
- El código expira en **10 minutos**
- Puedes reenviar el código después de **2 minutos**

#### Login
1. Ingresar email y contraseña
2. Tocar **"Iniciar Sesión"**
3. Se mostrará un modal para activar biometría (opcional)

#### Recuperar Contraseña Olvidada
1. En la pantalla de Login, tocar **"Olvidé mi Contraseña"**
2. Ingresar tu email
3. Tocar **"Enviar Código"**
4. Revisar email y copiar el código
5. Ingresar el código de verificación
6. Crear nueva contraseña
7. Confirmar nueva contraseña
8. Tocar **"Actualizar Contraseña"**

#### Recuperar Registro Pendiente
Si iniciaste un registro pero no lo completaste:
1. En la pantalla de Login, tocar **"Recuperar Acceso"**
2. Ingresar tu email
3. Tocar **"Verificar Email"**
4. Si hay un registro pendiente, tocar **"Enviar código"**
5. Completar la verificación como en el registro normal

### 2. Activar Notificaciones y Permisos

Después del primer login:

1. Aparecerá un **banner en la parte inferior** solicitando permisos
2. Tocar **"Aceptar"**
3. Permitir acceso a **Notificaciones** (sistema)
4. Permitir acceso a **Cámara** (sistema)
5. Recibirás una notificación de prueba confirmando la activación

**Si pospusiste los permisos:**
- Aparecerá un botón flotante **"Activar Permisos"**
- Puedes activarlos en cualquier momento desde la tab **"Notificaciones"**

### 3. Configurar Autenticación Biométrica

La biometría es **opcional** y solo funciona durante la sesión actual.

#### Primera Configuración
1. Después del login, aparecerá un modal
2. Tocar **"Activar Ahora"** o **"Ahora no"**
3. Si aceptas:
   - Se abrirá el scanner biométrico/PIN
   - Autenticar con huella/Face ID/PIN
   - Se activará la biometría para esta sesión

#### Activar Después (desde Perfil)
1. Ir a la tab **"Perfil"**
2. Tocar el card **"Activar Huella Digital"** (o PIN del Dispositivo)
3. Ingresar tu **contraseña actual**
4. Tocar **"Confirmar"**
5. Autenticar con biometría/PIN

#### Desactivar Biometría
1. Ir a la tab **"Perfil"**
2. En el card verde **"Autenticación Segura: Activa"**
3. Tocar el ícono **X** rojo
4. Confirmar la desactivación

**⚠️ Notas Importantes:**
- La biometría se desactiva automáticamente al **cerrar sesión**
- Si la app va a segundo plano, pedirá autenticación al volver
- No se guarda tu contraseña, solo funciona mientras estés logueado

### 4. Explorar y Reservar Clases

#### Ver Clases Disponibles
1. En la tab **"Home"** verás todas las clases disponibles
2. Usa los **filtros superiores** para buscar:
   - **Sede**: Ubicación del gimnasio
   - **Sport**: Tipo de disciplina (Pilates, Yoga, etc.)
   - **Hora**: Horario de la clase

#### Reservar una Clase
1. Tocar una clase de la lista
2. Revisar los detalles:
   - Nombre del curso
   - Fecha y horario
   - Ubicación (mapa)
   - Profesor
   - Precio
3. Tocar el botón **"Cómo llegar a la sede"** para ver direcciones
4. Tocar **"Reservar"**
5. Confirmar la reserva

**📱 Notificación Automática:**
- Al reservar, se programa automáticamente un recordatorio
- Recibirás una notificación **1 hora antes** de la clase

### 5. Gestionar Reservas

#### Ver Mis Reservas
1. Ir a la tab **"Mis Reservas"**
2. Verás todas tus reservas activas con:
   - Nombre de la clase
   - Turno y horario
   - Estado (Confirmada, Pendiente, etc.)

#### Cancelar una Reserva
1. En **"Mis Reservas"**, localizar la clase
2. Tocar el botón rojo **"Cancelar Reserva"**
3. Confirmar la cancelación
4. La notificación programada se cancelará automáticamente

**⚠️ Restricciones:**
- Solo puedes cancelar si el botón está habilitado
- Algunas reservas tienen política de cancelación

#### Refrescar la Lista
- Desliza hacia abajo (pull to refresh) para actualizar

### 6. Realizar Check-in

El check-in se realiza escaneando un código QR proporcionado por el gimnasio.

#### Proceso de Check-in
1. Ir a la tab **"Check-in"**
2. Apuntar la cámara al código QR de la clase
3. La app leerá automáticamente el código
4. Aparecerá una pantalla de confirmación mostrando:
   - Número de turno
   - Detalles de la clase
5. Tocar **"Confirmar check-in"**
6. Recibirás confirmación de asistencia registrada

**🚫 Errores Comunes:**
- **"QR inválido"**: El código no corresponde a ninguna clase
- **"No se encontró token"**: Debes iniciar sesión nuevamente

**💡 Tip**: Puedes tocar **"Volver a escanear"** si escaneaste el código equivocado.

### 7. Ver Historial

#### Acceder al Historial
1. Ir a la tab **"Historial"**
2. Verás todas las clases a las que asististe
3. Desliza hacia abajo para refrescar

#### Calificar una Clase
1. Localizar la clase que quieres calificar
2. Tocar el botón **"Calificar"**
3. Seleccionar número de estrellas (1-5)
4. (Opcional) Agregar un comentario
5. Tocar **"Calificar"**

**✅ Estado**: Las clases ya calificadas mostrarán **"Tu calificación: X"**

### 8. Editar Perfil

#### Cambiar Foto de Perfil
1. Ir a la tab **"Perfil"**
2. Tocar **"Elegir imagen"**
3. Seleccionar una foto de tu galería
4. La foto se actualizará inmediatamente

#### Actualizar Nombre
1. Editar el campo de nombre
2. Tocar **"Guardar cambios"**
3. Recibirás confirmación de actualización

**🔒 Email**: El email no se puede editar después del registro.

### 9. Gestionar Notificaciones

#### Ver Estado de Notificaciones
1. Ir a la tab **"Notificaciones"**
2. Verás:
   - **Estado de permisos** (Otorgados/No otorgados)
   - **Tarea en background** (Activa/Inactiva)
   - **Notificaciones sin leer**
   - **Notificaciones programadas**

#### Probar Notificaciones
En la sección **"Pruebas"**:

1. **Enviar Notificaciones de Prueba**
   - Envía 3 notificaciones de prueba
   - Una inmediata, una en 10 segundos, otra en 1 minuto

2. **Ver Notificaciones Programadas**
   - Muestra lista completa con fechas/horas
   - Útil para verificar recordatorios de clases

3. **Probar Long Polling**
   - Verifica conexión con el backend
   - Muestra eventos pendientes

4. **Actualizar Estado**
   - Refresca toda la información

5. **Cancelar Todas**
   - Cancela todas las notificaciones programadas
   - **⚠️ Cuidado**: Incluye recordatorios de clases

#### Tipos de Notificaciones

La app envía estos tipos de notificaciones:

1. **🔔 Recordatorios de Clase**
   - 1 hora antes de cada clase reservada
   - Se programan automáticamente al reservar
   - Se cancelan si cancelas la reserva

2. **❌ Clases Canceladas**
   - Notificación inmediata si el gimnasio cancela una clase
   - Se cancela el recordatorio automáticamente

3. **📅 Clases Reprogramadas**
   - Aviso si cambia el horario de tu clase
   - Se programa nuevo recordatorio

4. **⏰ Reservas por Expirar**
   - Aviso antes de que expire tu reserva

### 10. Cerrar Sesión

#### Proceso Normal
1. Ir a la tab **"Perfil"**
2. Scroll hasta el final
3. Tocar el botón rojo **"Cerrar Sesión"**
4. Confirmar en el modal
5. Se limpiarán:
   - Token de autenticación
   - Configuración de biometría
   - Datos de sesión (no el historial)

**📝 Nota**: Los datos básicos (email, nombre) se mantienen en caché para el próximo login.

## 🔍 Solución de Problemas

### No recibo notificaciones

**Verificar:**
1. Ve a **"Notificaciones"** tab
2. Verifica que **Permisos** esté en **"Otorgados"**
3. Toca **"Enviar Notificaciones de Prueba"**
4. Si no aparecen:
   - Ve a Configuración Android > Apps > Ritmo Fit > Notificaciones
   - Activa todas las notificaciones
   - Configura "Notificaciones Principales" en prioridad **Alta**

### La cámara no funciona para QR

1. Ve a Configuración Android > Apps > Ritmo Fit > Permisos
2. Activa **Cámara**
3. Reinicia la app

### No puedo activar biometría

**Verificar:**
1. Tu dispositivo tiene huella/Face ID/PIN configurado
2. Ve a Configuración Android > Seguridad > Desbloqueo de pantalla
3. Configura al menos un método de desbloqueo

### Error "No se encontró token"

**Solución:**
1. Cerrar sesión completamente
2. Limpiar caché de la app (opcional)
3. Iniciar sesión nuevamente

### La app no se conecta al backend

**Verificar:**
1. El backend está corriendo en `http://TU_IP:8080`
2. Tu dispositivo está en la **misma red WiFi** que tu PC
3. El archivo `.env` tiene la IP correcta:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.X.X:8080
   ```
4. Reinicia el servidor de desarrollo:
   ```bash
   npx expo start --dev-client --clear
   ```

### Error al compilar development build

**Solución:**
1. Limpiar caché:
   ```bash
   npx expo start --clear
   ```

2. Reinstalar dependencias:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Rebuild:
   ```bash
   eas build --profile development --platform android --clear-cache
   ```

## 🏗️ Estructura del Proyecto

```
ritmo-fit-app/
├── App.js                          # Punto de entrada principal
├── app.json                        # Configuración de Expo
├── package.json                    # Dependencias
├── .env                            # Variables de entorno (NO COMMITEAR)
├── assets/                         # Imágenes, logos, iconos
├── config/
│   ├── constants.js                # Constantes globales
│   └── toastConfig.js              # Configuración de notificaciones toast
├── gymApp/
│   ├── components/                 # Componentes reutilizables
│   │   ├── ErrorBoundary.js        # Manejo de errores
│   │   ├── BiometricSetupManager.js
│   │   ├── ConfirmModal.js
│   │   └── ...
│   └── screens/                    # Pantallas de la app
│       ├── auth/                   # Autenticación
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   ├── VerificationScreen.js
│       │   ├── ForgotPasswordScreen.js
│       │   ├── ResetPassVerifScreen.js
│       │   └── NewPasswordScreen.js
│       ├── HomeScreen.js
│       ├── PerfilScreen.js
│       ├── MisReservasScreen.js
│       ├── CheckinScreen.js
│       ├── HistorialScreen.js
│       ├── DetalleCursoScreen.js
│       └── NotificationSettingsScreen.js
├── navigation/
│   ├── RootNavigator.js            # Navegación raíz
│   ├── AuthStack.js                # Stack de autenticación
│   └── AppStack.js                 # Stack principal de la app
├── services/
│   ├── authAPI.js                  # API de autenticación
│   ├── longPollService.js          # Servicio de notificaciones
│   └── reservas.js                 # API de reservas
├── store/
│   ├── store.js                    # Configuración de Redux
│   └── slices/
│       ├── authSlice.js            # Estado de autenticación
│       ├── userSlice.js            # Estado de usuario
│       ├── biometricSlice.js       # Estado de biometría
│       └── errorSlice.js           # Manejo de errores
└── utils/
    ├── biometricUtils.js           # Utilidades de biometría
    ├── biometricStorageUtils.js    # Almacenamiento seguro
    ├── toastUtils.js               # Utilidades de toast
    ├── errorUtils.js               # Manejo de errores
    └── validationUtils.js          # Validaciones de formularios
```

## 🧪 Testing

### Probar Notificaciones

1. Reserva una clase
2. En la tab "Notificaciones", toca "Ver Notificaciones Programadas"
3. Debes ver tu recordatorio programado para 1 hora antes
4. O usa "Enviar Notificaciones de Prueba" para testing inmediato

### Probar Biometría

1. Activa biometría desde Perfil
2. Cierra la app completamente
3. Ábrela de nuevo
4. Debe pedirte autenticación biométrica

### Probar Check-in

**Generar QR de prueba:**
- Usa cualquier generador de QR online
- Texto del QR: el ID numérico de un shift existente (ej: `123`)
- Escanea con la app

## 📱 Comandos Útiles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npx expo start --dev-client

# Limpiar caché
npx expo start --clear

# Ver logs de Android
npx react-native log-android
# o
adb logcat

# Reinstalar en dispositivo
npx expo run:android
```

### Builds

```bash
# Development build
eas build --profile development --platform android

# Preview build (APK)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform android
```

### Debugging

```bash
# Inspeccionar elemento (React DevTools)
npx react-devtools

# Ver logs del dispositivo
adb logcat | grep -i ReactNative

# Limpiar completamente
rm -rf node_modules
npm install
npx expo start --clear
```

## 🔒 Seguridad y Privacidad

- Las contraseñas se almacenan encriptadas en el backend
- Los tokens de autenticación usan JWT con expiración
- La información biométrica NUNCA se almacena en el dispositivo
- Credenciales guardadas con `expo-secure-store` (cifrado por hardware)
- Comunicación con backend a través de HTTPS (producción)

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para reportar bugs o solicitar features:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ por el equipo de Ritmo Fit**
