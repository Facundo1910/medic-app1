# MedicApp - Sistema de Gestión Médica

Una aplicación web completa para la gestión de información médica de pacientes, desarrollada con Vue.js, Firebase y Brevo.

## 🚀 Funcionalidades

### 👤 Pacientes
- Registro con nombre, apellido, DNI, email y año de nacimiento
- Visualización de diagnósticos médicos
- Historial completo de medicaciones
- Notificaciones por email cuando se registran nuevas medicaciones
- Interfaz moderna y responsive

### 🩺 Enfermeras
- Registro con validación por administrador
- Gestión de pacientes y sus diagnósticos
- Registro de medicaciones con validaciones
- Búsqueda automática de medicamentos y diagnósticos
- Envío automático de notificaciones por email

### 🔧 Administradores
- Panel de administración completo
- Aprobación/rechazo de solicitudes de enfermeras
- Gestión de cuentas de administrador
- Notificaciones por email de nuevas solicitudes

## 🛠️ Tecnologías

- **Frontend**: Vue.js 2.6, Vue Router
- **Backend**: Firebase Firestore
- **Emails**: Brevo (anteriormente Sendinblue)
- **UI**: CSS personalizado con diseño moderno
- **Despliegue**: Vercel

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd medic-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear el archivo `.env.local` en la raíz del proyecto:
```env
VUE_APP_BREVO_API_KEY=tu-api-key-de-brevo
```

4. **Ejecutar en desarrollo**
```bash
npm run serve
```

## 🔧 Configuración

### Firebase
La aplicación ya está configurada con Firebase. Si necesitas cambiar la configuración, edita `src/firebase.js`.

### Brevo (Emails)
1. Ve a [Brevo](https://app.brevo.com/)
2. Crea una cuenta y obtén tu API key
3. Agrega la API key en `.env.local`

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. El archivo `vercel.json` ya está configurado

### Otros proveedores
```bash
npm run build
```

## 📱 Uso

### Registro de Usuarios
- **Pacientes**: Registro directo con validaciones
- **Enfermeras**: Registro con aprobación por administrador
- **Administradores**: Creación manual en `/create-admin`

### Login
- **Pacientes/Enfermeras**: DNI + contraseña
- **Administradores**: Email + contraseña

## 🔒 Seguridad

- Validación de roles en todas las rutas
- Validación de datos en formularios
- API keys protegidas en variables de entorno
- Autenticación basada en localStorage

## 📧 Notificaciones

- Notificaciones automáticas por email cuando se registran medicaciones
- Emails de validación para enfermeras
- Configuración flexible de templates

## 🎨 Diseño

- Interfaz moderna y responsive
- Diseño consistente en toda la aplicación
- Modales y formularios optimizados
- Colores personalizados y gradientes

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 🤝 Contribución

Para contribuir al proyecto, contacta al equipo de desarrollo.
