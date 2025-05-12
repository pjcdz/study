# Componentes de Shadcn UI utilizados en el proyecto

## Componentes instalados
- Alert
- AlertDialog
- Badge
- Button
- Card
- Dialog
- Input
- Progress
- ScrollArea
- Skeleton
- Sonner (En lugar de Toast/Toaster)
- Tabs
- Textarea
- Switch (Para implementar selector de idioma)
- DropdownMenu (Para selector de idioma y selector de tema)

## Bibliotecas externas
- sonner (Notificaciones toast)
- next-intl (Internacionalización)
- next-themes (Tema oscuro/claro)
- react-markdown (Renderizado de Markdown)
- zustand (Persistencia con middleware persist)

## Reemplazos a componentes estándar de Shadcn
- Toast/Toaster -> Sonner (https://sonner.emilkowalski.co/)

## Componentes personalizados
- FileDropzone (basado en Card)
- FileList (utiliza Badge y Button)
- LanguageSwitcher (basado en Switch/DropdownMenu)
- ThemeSwitcher (basado en DropdownMenu)
- MarkdownPreview (basado en react-markdown)