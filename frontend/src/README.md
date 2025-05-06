# Study Assist - Documentación Técnica

## Arquitectura de la Aplicación (Application Architecture)

La aplicación implementa una **Screaming Architecture** junto con principios de **separación de responsabilidades** (separation of concerns) y **componentes modulares** (modular components). La estructura del proyecto "grita" su propósito a través de su organización:

### 1. Estructura del Proyecto (Screaming Architecture)

```
src/
  features/           # Funcionalidades principales de la aplicación
    upload/          # Todo lo relacionado con la carga de documentos
    summary/         # Generación y visualización de resúmenes
    flashcards/      # Generación y gestión de tarjetas de estudio
  shared/           # Utilidades y servicios compartidos
    hooks/         # Hooks reutilizables
    services/      # Servicios globales (apiClient)
    utils/         # Utilidades generales (traducciones, temas)
    components/    # Componentes compartidos (accesibilidad)
```

Esta estructura refleja inmediatamente el propósito y las capacidades del sistema, siguiendo los principios de Screaming Architecture donde:
- Cada característica (feature) está autocontenida
- Los nombres de directorios comunican su intención
- La estructura prioriza el dominio sobre los detalles técnicos

### 2. Custom Hooks y Contextos (Hooks Personalizados)

- **AccessibilityContext.jsx**: Centraliza la gestión de accesibilidad
  - Mantiene el estado del tema (claro/oscuro) y el idioma
  - Proporciona funciones para cambiar preferencias
  - Implementa detección automática de preferencias del sistema

### 3. Servicios (Services)

- **apiClient.js**: Gestiona la comunicación con el backend
  - Proporciona métodos para generar resúmenes
  - Envía solicitudes para crear tarjetas de estudio
  - Maneja errores y transformaciones de datos

- **themeUtils.js**: Gestiona temas y estilos
  - Define colores y variables CSS para temas
  - Aplica cambios de tema al documento

### 4. Componentes UI (UI Components)

- **App.jsx**: Componente principal que orquesta todos los elementos
  - Coordina navegación entre pasos del flujo
  - Gestiona estado global de la aplicación
  - Implementa persistencia local de datos

- **UploadPane.jsx**: Gestión de carga de documentos
  - Permite subida y procesamiento de archivos
  - Ofrece entrada de texto para contenido manual
  - Envía datos al backend para procesamiento

- **MarkdownPane.jsx**: Visualización y edición de resúmenes
  - Muestra el resumen generado con formato markdown
  - Permite edición del contenido
  - Facilita la generación de tarjetas desde el resumen

- **FlashcardPane.jsx**: Gestión de tarjetas de estudio
  - Muestra tarjetas generadas en formato TSV
  - Permite copiarlas al portapapeles
  - Facilita exportación a plataformas como Quizlet

## Flujo de Datos (Data Flow)

La aplicación implementa un flujo de datos unidireccional:

1. El estado se mantiene centralizado en el componente App.jsx
2. Los eventos de usuario se capturan en componentes de características (features)
3. Los handlers procesan estos eventos y actualizan el estado
4. Los componentes UI se re-renderizan con el nuevo estado

Este patrón minimiza efectos secundarios inesperados y hace que la aplicación sea más predecible.

## Extensión de la Aplicación

Para añadir nuevas funcionalidades siguiendo la Screaming Architecture:

1. Crear un nuevo directorio en `features/` para la nueva funcionalidad
2. Estructurar el feature con sus propios:
   - components/
   - hooks/
   - services/
   - types/ (si es necesario)
3. Para funcionalidad compartida, utilizar la carpeta `shared/`
4. Nuevos endpoints API: Modificar `apiClient.js`
5. Nuevas traducciones: Actualizar `translations.js`

## Prácticas Recomendadas (Best Practices)

- **Screaming Architecture**: Estructura que comunica el propósito del sistema
- **Feature-First**: Organización primaria por características de negocio
- **Cohesión por Dominio**: Agrupación de código por dominio funcional
- **Memoización**: Uso de useCallback para funciones estables
- **Referencias**: Uso de useRef para acceder al DOM
- **Efectos Controlados**: useEffect con dependencias bien definidas
- **Estado Centralizado**: Componentes y hooks para gestión de estado
- **Componentes Pequeños**: División en componentes con responsabilidad única
- **Internacionalización**: Soporte multiidioma con traducciones
- **Accesibilidad**: Soporte para modos de visualización y preferencias de usuario
