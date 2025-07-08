// Configuración de EmailJS
// Para configurar EmailJS:
// 1. Ve a https://www.emailjs.com/ y crea una cuenta
// 2. Crea un Email Service (Gmail, Outlook, etc.)
// 3. Crea un Email Template
// 4. Reemplaza los valores abajo con tus credenciales

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_yt1zyld',
  TEMPLATE_ID: 'template_z6hdnq9',
  PUBLIC_KEY: 'Vj4VQhL2SDkbzkxbz'
};

// INSTRUCCIONES:
// 1. Reemplaza 'YOUR_SERVICE_ID' con tu Service ID real
// 2. Reemplaza 'YOUR_TEMPLATE_ID' con tu Template ID real  
// 3. Reemplaza 'YOUR_PUBLIC_KEY' con tu Public Key real
// 4. Guarda el archivo
// 5. Reinicia el servidor de desarrollo

// Template de ejemplo para EmailJS:
/*
Asunto: Notificación de Medicación - {{medicamento}}

Hola {{to_name}},

Se ha registrado una nueva medicación en tu historial médico:

💊 Medicamento: {{medicamento}}
📊 Dosis: {{dosis}}
📅 Fecha y hora: {{fecha_hora}}
👩‍⚕️ Administrado por: {{enfermera}}

Esta notificación se envía automáticamente cada vez que se registra una nueva medicación en tu historial médico.

Saludos,
Equipo Médico
*/ 