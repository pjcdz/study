# Simple Chat App - Documentación Técnica

## Arquitectura de la Aplicación (Application Architecture)

La aplicación implementa una **Screaming Architecture** junto con principios de **separación de responsabilidades** (separation of concerns) y **componentes modulares** (modular components). La estructura del proyecto "grita" su propósito a través de su organización:

### 1. Estructura del Proyecto (Screaming Architecture)

```
src/
  features/           # Funcionalidades principales de la aplicación
    auth/            # Todo lo relacionado con autenticación
    chat/           # Funcionalidad central de chat
    terminal/       # Componentes del terminal
  shared/           # Utilidades y servicios compartidos
    hooks/         # Hooks reutilizables
    services/      # Servicios globales
    utils/         # Utilidades generales
```

Esta estructura refleja inmediatamente el propósito y las capacidades del sistema, siguiendo los principios de Screaming Architecture donde:
- Cada característica (feature) está autocontenida
- Los nombres de directorios comunican su intención
- La estructura prioriza el dominio sobre los detalles técnicos

### 2. Custom Hooks (Hooks Personalizados)

- **useTerminalState.js**: Centraliza la gestión de estado (state management)
  - Mantiene todos los estados del terminal y referencias DOM
  - Proporciona un único punto de acceso para variables de estado

- **useMessageHandler.js**: Maneja operaciones de mensajes
  - Procesa comandos y respuestas 
  - Implementa la lógica de visualización de mensajes

### 3. Servicios (Services)

- **CommandProcessor.js**: Interpreta y ejecuta comandos
  - Simula un sistema de comandos tipo Linux
  - Retorna respuestas basadas en comandos ingresados

- **DemoService.js**: Implementa funcionalidad de demostración
  - Ejecuta secuencias automáticas de comandos
  - Simula interacción entre múltiples usuarios

### 4. Componentes UI (UI Components)

- **Chat.jsx**: Componente principal que orquesta todos los elementos
  - Coordina hooks, servicios y componentes de UI
  - Gestiona efectos secundarios (side effects)

- **TerminalContainer.jsx**: Estructura visual principal
  - Proporciona el layout base del terminal
  - Gestiona estilo y disposición de elementos

- **TerminalMessages.jsx**: Visualización de mensajes
  - Renderiza el historial de mensajes
  - Aplica estilos según tipo de mensaje

- **TerminalInput.jsx**: Entrada de comandos
  - Captura input del usuario
  - Maneja eventos de teclado

## Flujo de Datos (Data Flow)

La aplicación implementa un flujo de datos unidireccional:

1. El estado se mantiene centralizado en los hooks
2. Los eventos de usuario se capturan en componentes UI
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
4. Nuevos comandos: Modificar `CommandProcessor.js`
5. Nuevos tipos de mensaje: Actualizar `TerminalMessages.jsx`

## Prácticas Recomendadas (Best Practices)

- **Screaming Architecture**: Estructura que comunica el propósito del sistema
- **Feature-First**: Organización primaria por características de negocio
- **Cohesión por Dominio**: Agrupación de código por dominio funcional
- **Memoización**: Uso de useCallback para funciones estables
- **Referencias**: Uso de useRef para acceder al DOM
- **Efectos Controlados**: useEffect con dependencias bien definidas
- **Estado Centralizado**: Hooks personalizados para gestión de estado
- **Componentes Pequeños**: División en componentes con responsabilidad única
