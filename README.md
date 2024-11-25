# Login Seguro App

## 🔒 Descripción
Aplicación web de login seguro que implementa múltiples capas de seguridad para prevenir ataques comunes y proteger la integridad de las sesiones de usuario.

## 🛠️ Tecnologías Utilizadas
- **React** (v18) con **TypeScript**
- **Supabase** para autenticación y manejo de sesiones
- **Chakra UI** para la interfaz de usuario
- **React Router** para navegación
- **GitHub Pages** para despliegue

## 🔐 Características de Seguridad

### 1. Protección contra Fuerza Bruta
- Límite de 3 intentos de inicio de sesión
- Bloqueo temporal de 15 minutos después de exceder los intentos
- Contador visual de intentos restantes
- Persistencia del bloqueo incluso si se cierra el navegador
- Barra de progreso para el tiempo de bloqueo restante

### 2. Prevención de SQL Injection
- Validación estricta de entradas
- Patrones de detección para consultas maliciosas
- Sanitización de datos de entrada
- Uso de consultas parametrizadas a través de Supabase

### 3. Protección contra Secuestro de Sesión
- Sistema de sesión única
- Detección y cierre automático de sesiones duplicadas
- Verificación continua del token de sesión (cada 5 segundos)
- Tokens JWT seguros manejados por Supabase
- Almacenamiento seguro de tokens

### 4. Seguridad de Contraseñas
- Encriptación de contraseñas mediante Supabase
- No se almacenan contraseñas en texto plano
- Validación de fortaleza de contraseña
- Transmisión segura de credenciales

## 🏗️ Arquitectura

### Componentes Principales
1. **Login (Login.tsx)**
   - Maneja autenticación
   - Implementa protección contra fuerza bruta
   - Gestiona intentos fallidos
   - Muestra retroalimentación visual

2. **Profile (Profile.tsx)**
   - Verifica estado de sesión
   - Detecta sesiones duplicadas
   - Muestra información del usuario
   - Maneja cierre de sesión seguro

3. **App (App.tsx)**
   - Gestiona rutas protegidas
   - Maneja redirecciones
   - Configura el tema y providers

### Flujo de Seguridad
1. **Inicio de Sesión**
   ```
   Usuario intenta login
   ↓
   Validación de entrada
   ↓
   Verificación de intentos
   ↓
   Autenticación con Supabase
   ↓
   Verificación de sesiones existentes
   ↓
   Creación de nueva sesión única
   ```

2. **Protección Continua**
   ```
   Verificación periódica de token
   ↓
   Detección de sesiones duplicadas
   ↓
   Cierre automático de sesiones no autorizadas
   ↓
   Actualización de estado de UI
   ```

## 🚀 Despliegue
La aplicación está desplegada en GitHub Pages y utiliza HashRouter para manejar rutas en el cliente de forma segura.

## 🔍 Pruebas de Seguridad
1. **Test de Fuerza Bruta**
   - Intentar login múltiples veces
   - Verificar bloqueo temporal
   - Confirmar persistencia del bloqueo

2. **Test de Sesión Única**
   - Abrir sesión en múltiples navegadores
   - Verificar que solo una sesión permanece activa
   - Confirmar redirección automática

3. **Test de Validación de Entrada**
   - Intentar inyección SQL
   - Probar caracteres especiales
   - Verificar sanitización

## 💻 Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/[tu-usuario]/login-seguro-app.git

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Construir para producción
npm run build

# Desplegar a GitHub Pages
npm run deploy
```

## 🌐 Variables de Entorno
```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key
```

## 🔑 Credenciales de Prueba
```
Email: test@test.com
Password: Test123!
```

## 🛡️ Mejores Prácticas Implementadas
- Manejo seguro de sesiones
- Validación estricta de entrada
- Retroalimentación clara al usuario
- Almacenamiento seguro de tokens
- Control de acceso basado en roles
- Manejo de errores consistente

## 📝 Notas Importantes
- La aplicación está optimizada para GitHub Pages
- Se utiliza HashRouter para navegación en producción
- Las rutas están protegidas contra acceso no autorizado
- Se implementa un sistema de timeout para sesiones inactivas
- Los tokens se renuevan automáticamente según sea necesario

## 🤝 Contribuir
Las contribuciones son bienvenidas. Por favor, asegúrate de probar cualquier cambio contra los vectores de ataque conocidos antes de enviar un PR.

## 📄 Licencia
MIT License
