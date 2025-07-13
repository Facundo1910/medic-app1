# Configuración de Notificaciones por Email

Este documento explica cómo configurar las notificaciones por email que se envían automáticamente cada vez que se registra un medicamento.

## ¿Qué hace esta funcionalidad?

- Envía un email automático al paciente cada vez que una enfermera registra un medicamento
- El email incluye detalles como: medicamento, dosis, fecha/hora y enfermera responsable
- Solo funciona si el paciente tiene un email registrado en su perfil

## Configuración de EmailJS

### Paso 1: Crear cuenta en EmailJS
1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Crea una cuenta gratuita
3. Verifica tu email

### Paso 2: Crear un Email Service
1. En el dashboard de EmailJS, ve a "Email Services"
2. Haz clic en "Add New Service"
3. Selecciona tu proveedor de email (Gmail, Outlook, etc.)
4. Sigue las instrucciones para conectar tu cuenta de email
5. Anota el **Service ID** que se genera

### Paso 3: Crear un Email Template
1. Ve a "Email Templates"
2. Haz clic en "Create New Template"
3. Usa este template como base:

**Asunto:**
```
Notificación de Medicación - {{medicamento}}
```

**Contenido:**
```
Hola {{to_name}},

Se ha registrado una nueva medicación en tu historial médico:

💊 Medicamento: {{medicamento}}
📊 Dosis: {{dosis}}
📅 Fecha y hora: {{fecha_hora}}
👩‍⚕️ Administrado por: {{enfermera}}

Esta notificación se envía automáticamente cada vez que se registra una nueva medicación en tu historial médico.

Saludos,
Equipo Médico
```

4. Guarda el template y anota el **Template ID**

### Paso 4: Obtener tu Public Key
1. Ve a "Account" en el menú
2. En la sección "API Keys", copia tu **Public Key**

### Paso 5: Configurar la aplicación
1. Abre el archivo `src/config/emailConfig.js`
2. Reemplaza los valores con tus credenciales:

```javascript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'tu_service_id_aqui',
  TEMPLATE_ID: 'tu_template_id_aqui', 
  PUBLIC_KEY: 'tu_public_key_aqui'
};
```

## Variables disponibles en el template

- `{{to_name}}` - Nombre del paciente
- `{{to_email}}` - Email del paciente
- `{{medicamento}}` - Nombre del medicamento
- `{{dosis}}` - Dosis administrada (incluye "mg")
- `{{fecha_hora}}` - Fecha y hora formateada
- `{{enfermera}}` - Nombre de la enfermera

## Pruebas

1. Asegúrate de que un paciente tenga un email registrado
2. Registra un medicamento como enfermera
3. Verifica que el email se envíe correctamente
4. Revisa la consola del navegador para ver logs de éxito/error

## Solución de problemas

### "EmailJS no configurado"
- Verifica que hayas configurado todos los valores en `emailConfig.js`
- Asegúrate de que los IDs sean correctos

### "El paciente no tiene email registrado"
- El paciente debe tener un email en su perfil
- Verifica que el campo email esté completo en la base de datos

### "Error al enviar notificación"
- Verifica tu conexión a internet
- Revisa que tu Email Service esté activo
- Consulta los logs en la consola del navegador

## Limitaciones del plan gratuito

- EmailJS gratuito permite 200 emails por mes
- Para uso en producción, considera un plan de pago
- Los emails se envían desde tu cuenta de email personal

## Seguridad

- Las credenciales están en el frontend (no es lo más seguro)
- Para mayor seguridad, considera usar un backend propio
- Los emails se envían desde tu cuenta personal de email 