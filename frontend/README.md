# Study Assist Frontend

Este proyecto contiene la interfaz de usuario para Study Assist, una herramienta que transforma documentos y textos en materiales de estudio efectivos mediante inteligencia artificial.

## Características

- **Procesamiento de contenido**: Carga de documentos o ingreso manual de texto para ser resumido
- **Generación de resúmenes**: Utiliza Google Gemini 2.0 para crear resúmenes estructurados en formato markdown
- **Creación de flashcards**: Genera automáticamente tarjetas de estudio importables a Quizlet
- **UI/UX moderna**: Interfaz responsiva con soporte para temas claro/oscuro
- **Accesibilidad**: Opciones de personalización que incluyen cambio de tema e idioma
- **Multilenguaje**: Soporte completo para español e inglés

## Tecnologías

- React 19 con Vite
- TailwindCSS para estilos
- React Icons para iconografía
- React Markdown para renderizado de contenido
- React Toastify para notificaciones

## Estructura del proyecto

El proyecto está organizado siguiendo una arquitectura por características (Feature-First):

```
src/
  features/         # Funcionalidades principales separadas por dominio
    upload/        # Componentes para carga de documentos
    summary/       # Componentes para visualización de resúmenes
    flashcards/    # Componentes para gestión de tarjetas
  shared/          # Código compartido entre características
    components/    # Componentes reutilizables
    services/      # Servicios (API client)
    utils/         # Utilidades (traducciones, temas)
```

Para más detalles sobre la arquitectura técnica, consultar el archivo [src/README.md](./src/README.md).

## Desarrollo

### Requisitos previos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación se ejecutará en modo de desarrollo en [http://localhost:5173](http://localhost:5173)

### Comandos disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Compila la aplicación para producción
- `npm run lint`: Ejecuta el linter para verificar el código
- `npm run preview`: Vista previa de la versión de producción

## Despliegue

La aplicación está configurada para ser desplegada como contenedor Docker. Para más información sobre el despliegue, consulta el README principal del proyecto.
