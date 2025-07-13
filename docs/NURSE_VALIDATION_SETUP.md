# Sistema de Validación de Enfermeras

Este documento explica cómo configurar el sistema de validación por email para las cuentas de enfermeras.

## ¿Qué hace este sistema?

1. **Registro de Enfermeras**: Cuando una enfermera se registra, su cuenta queda en estado "pendiente"
2. **Notificación al Administrador**: Se envía un email al administrador con los datos de la enfermera
3. **Panel de Administración**: El administrador puede aprobar o rechazar las solicitudes
4. **Notificación a la Enfermera**: Se envía un email a la enfermera informando si fue aprobada o rechazada
5. **Acceso Controlado**: Solo las enfermeras aprobadas pueden iniciar sesión

## Configuración Paso a Paso

### Paso 1: Configurar EmailJS

Si ya tienes EmailJS configurado para las notificaciones de medicación, puedes usar la misma cuenta.

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Crea una cuenta gratuita o inicia sesión
3. Verifica tu email

### Paso 2: Crear Templates de Email

Necesitas crear **3 templates** en EmailJS:

#### Template 1: Solicitud de Validación (para el administrador)

**Nombre del Template**: `template_nurse_validation`

**Asunto**:
```
Nueva Solicitud de Validación - Enfermera: {{nurse_name}}
```

**Contenido**:
```
Hola {{to_name}},

Se ha recibido una nueva solicitud de validación para una cuenta de enfermera:

👩‍⚕️ **Datos de la Enfermera:**
- Nombre: {{nurse_name}}
- Email: {{nurse_email}}
- Año de nacimiento: {{nurse_anio}}
- Fecha de solicitud: {{fecha_solicitud}}
- ID de solicitud: {{request_id}}

Para aprobar o rechazar esta solicitud, accede al panel de administración de tu aplicación.

Saludos,
Sistema de Validación
```

#### Template 2: Cuenta Aprobada (para la enfermera)

**Nombre del Template**: `template_nurse_approved`

**Asunto**:
```
✅ Tu cuenta de enfermera ha sido aprobada
```

**Contenido**:
```
Hola {{to_name}},

¡Excelente noticia! Tu solicitud de cuenta de enfermera ha sido aprobada.

🎉 **Tu cuenta está lista para usar**

Ya puedes iniciar sesión en la aplicación con tus credenciales.

{{admin_message}}

Saludos,
Equipo Médico
```

#### Template 3: Cuenta Rechazada (para la enfermera)

**Nombre del Template**: `template_nurse_rejected`

**Asunto**:
```
❌ Tu solicitud de cuenta de enfermera ha sido rechazada
```

**Contenido**:
```
Hola {{to_name}},

Lamentamos informarte que tu solicitud de cuenta de enfermera ha sido rechazada.

{{rejection_reason}}

Si tienes alguna pregunta, por favor contacta al administrador del sistema.

Saludos,
Equipo Médico
```

### Paso 3: Configurar el Email del Administrador

1. Abre el archivo `src/services/nurseValidationService.js`
2. Cambia la línea 7:
   ```javascript
   const ADMIN_EMAIL = 'tu-email@ejemplo.com'; // Cambia esto por tu email real
   ```
3. Reemplaza `'tu-email@ejemplo.com'` con tu email real

### Paso 4: Crear Cuenta de Administrador

Necesitas crear una cuenta de administrador en Firestore para acceder al panel de administración.

1. Ve a la consola de Firebase
2. Navega a Firestore Database
3. Crea una nueva colección llamada `admins`
4. Agrega un documento con estos campos:
   ```json
   {
     "nombre": "Tu Nombre",
     "clave": "tu-clave-segura",
     "email": "tu-email@ejemplo.com",
     "rol": "admin"
   }
   ```

### Paso 5: Actualizar la Configuración de EmailJS

1. Abre el archivo `src/config/emailConfig.js`
2. Asegúrate de que los valores estén configurados correctamente:
   ```javascript
   export const EMAILJS_CONFIG = {
     SERVICE_ID: 'tu_service_id_real',
     TEMPLATE_ID: 'tu_template_id_real',
     PUBLIC_KEY: 'tu_public_key_real'
   };
   ```

## Cómo Funciona el Sistema

### Para las Enfermeras:

1. **Registro**: Una enfermera se registra normalmente
2. **Estado Pendiente**: Su cuenta queda en estado "pendiente" hasta ser aprobada
3. **Notificación**: Recibe un email cuando su cuenta es aprobada o rechazada
4. **Acceso**: Solo puede iniciar sesión después de ser aprobada

### Para el Administrador:

1. **Notificación**: Recibe un email cada vez que una enfermera se registra
2. **Panel de Administración**: Accede a `/admin` para ver todas las solicitudes
3. **Aprobación/Rechazo**: Puede aprobar o rechazar solicitudes con mensajes personalizados
4. **Notificación Automática**: El sistema envía emails automáticamente a las enfermeras

## Acceso al Panel de Administración

1. Inicia sesión con tu cuenta de administrador
2. Ve a la URL: `http://localhost:8080/admin` (o tu dominio)
3. Verás todas las solicitudes pendientes de validación

## Estructura de Datos en Firestore

### Colección: `nurseValidationRequests`
```json
{
  "nombre": "Nombre de la Enfermera",
  "clave": "clave-encriptada",
  "anioNacimiento": "1990",
  "email": "enfermera@ejemplo.com",
  "rol": "enfermera",
  "estado": "pendiente|aprobado|rechazado",
  "fechaSolicitud": "2024-01-01T10:00:00.000Z",
  "aprobado": false,
  "fechaAprobacion": "2024-01-01T11:00:00.000Z",
  "fechaRechazo": "2024-01-01T11:00:00.000Z",
  "mensaje": "Mensaje del administrador",
  "motivoRechazo": "Motivo del rechazo"
}
```

### Colección: `enfermeras` (cuentas aprobadas)
```json
{
  "nombre": "Nombre de la Enfermera",
  "clave": "clave-encriptada",
  "anioNacimiento": "1990",
  "email": "enfermera@ejemplo.com",
  "rol": "enfermera",
  "aprobadoPor": "Administrador",
  "fechaAprobacion": "2024-01-01T11:00:00.000Z"
}
```

## Solución de Problemas

### Error: "El sistema de validación no está configurado"
- Verifica que EmailJS esté configurado correctamente
- Asegúrate de que el email del administrador esté configurado

### Error: "Tu cuenta de enfermera aún no ha sido aprobada"
- La enfermera debe esperar a que el administrador apruebe su cuenta
- Puede verificar el estado usando el botón "Verificar Estado de Validación"

### No llegan los emails
- Verifica la configuración de EmailJS
- Revisa que los templates tengan los nombres correctos
- Verifica que el email del administrador esté bien configurado

## Seguridad

- Las claves se almacenan en texto plano (considera implementar encriptación)
- Solo los administradores pueden aprobar cuentas
- Las solicitudes rechazadas se mantienen en el historial
- El sistema valida que las enfermeras estén aprobadas antes de permitir el login

## Personalización

Puedes personalizar:
- Los templates de email
- Los mensajes de confirmación
- El diseño del panel de administración
- Los criterios de validación
- El flujo de aprobación 