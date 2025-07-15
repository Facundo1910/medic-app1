# Gestión de Medicamentos - MedicApp

## Descripción

Esta funcionalidad permite a los administradores cargar y gestionar medicamentos que estarán disponibles para que las enfermeras los utilicen al registrar medicaciones para los pacientes.

## Características

### Panel de Administrador
- **Agregar Medicamentos**: Los administradores pueden cargar nuevos medicamentos con:
  - Nombre del medicamento
  - Descripción
  - Dosis recomendada (mg)
  - Frecuencia de administración
  - Instrucciones especiales

- **Gestionar Medicamentos**: 
  - Ver lista de medicamentos disponibles
  - Eliminar medicamentos
  - Los medicamentos se almacenan en Firestore

### Panel de Enfermera
- **Búsqueda Inteligente**: Al escribir en el campo de medicamento, se muestran sugerencias de:
  - Medicamentos cargados por el administrador (prioritarios)
  - Medicamentos de la API externa (CIMA - AEMPS)

- **Autocompletado**: 
  - Los medicamentos del administrador se destacan con un badge "💊 Admin"
  - Se muestra información adicional (dosis recomendada, frecuencia)
  - Al seleccionar un medicamento del administrador, se llena automáticamente la dosis recomendada

## Estructura de Datos

### Colección: `medicamentos`
```javascript
{
  id: "string",
  nombre: "string",           // Obligatorio
  descripcion: "string",      // Opcional
  dosisRecomendada: number,   // Opcional (mg)
  frecuencia: "string",       // Opcional
  instrucciones: "string",    // Opcional
  fechaCreacion: "string",    // ISO Date
  creadoPor: "string"         // Nombre del administrador
}
```

### Frecuencias Disponibles
- Cada 4 horas
- Cada 6 horas
- Cada 8 horas
- Cada 12 horas
- Una vez al día
- Dos veces al día
- Tres veces al día
- Según necesidad

## Flujo de Trabajo

1. **Administrador carga medicamentos**:
   - Accede al panel de administración
   - Va a la sección "💊 Gestión de Medicamentos"
   - Completa el formulario con los datos del medicamento
   - Guarda el medicamento

2. **Enfermera usa medicamentos**:
   - Accede al panel de enfermera
   - Selecciona un paciente
   - En el formulario de medicación, escribe el nombre del medicamento
   - Ve sugerencias que incluyen medicamentos del administrador
   - Selecciona un medicamento (se autocompleta la dosis si es del administrador)
   - Completa la fecha y hora
   - Registra la medicación

## Servicios

### `medicamentoService.js`
- `getMedicamentos()`: Obtiene todos los medicamentos
- `addMedicamento(data)`: Agrega un nuevo medicamento
- `deleteMedicamento(id)`: Elimina un medicamento
- `updateMedicamento(id, data)`: Actualiza un medicamento
- `searchMedicamentos(nombre)`: Busca medicamentos por nombre
- `getMedicamentosByFrecuencia(frecuencia)`: Filtra por frecuencia

## Componentes Modificados

### `AdminPanel.vue`
- Nueva sección de gestión de medicamentos
- Formulario para agregar medicamentos
- Lista de medicamentos con opción de eliminar

### `MedicacionForm.vue`
- Búsqueda mejorada que incluye medicamentos del administrador
- Sugerencias con información adicional
- Autocompletado de dosis para medicamentos del administrador

### `HomeEnfermera.vue`
- Carga medicamentos disponibles
- Pasa medicamentos al formulario de medicación

## Beneficios

1. **Estandarización**: Los administradores pueden cargar medicamentos estándar de la institución
2. **Eficiencia**: Las enfermeras tienen acceso rápido a medicamentos predefinidos
3. **Precisión**: Se evitan errores de escritura en nombres de medicamentos
4. **Información**: Se incluye dosis recomendada y frecuencia de administración
5. **Flexibilidad**: Se mantiene la opción de buscar en la API externa

## Consideraciones Técnicas

- Los medicamentos del administrador tienen prioridad en las sugerencias
- Se valida que no existan medicamentos duplicados
- La búsqueda es case-insensitive
- Los medicamentos se almacenan en Firestore para persistencia
- La interfaz es responsive y funciona en dispositivos móviles 