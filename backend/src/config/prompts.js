export const prompts = {
  notionPrompt: `Utilizando el formato establecido a continuación, elabora un resumen EXTENSO Y DETALLADO del contenido proporcionado (ya sea texto, PDF, imagen o combinación). Este resumen debe ser al menos 3 veces más largo que el resumen estándar, incluyendo explicaciones detalladas, ejemplos adicionales, análisis profundo y conexiones entre conceptos. NO omitas ningún detalle importante.

Si el contenido incluye imágenes o documentos PDF, analiza cuidadosamente el texto y los elementos visuales para extraer toda la información relevante.

📌 **INSTRUCCIÓN ADICIONAL**:  
- Asegúrate de que cada sección y subtítulo incluya al menos un emoji relevante.

Aquí un ejemplo del formato que debe seguir cada uno de los temas presentado por tu resumen:

🔹 **Requisitos clave**:  
- **Formato Cornell Notes** con encabezados jerárquicos para claridad.  
- **Destaque de conceptos clave** con negritas.  
- **Citas o definiciones** con formato de cita (\`>\`).  
- **Bloques de Callout** para información crítica o resúmenes.  
- **Listas y viñetas** para mejorar la organización.  
- **Bloques Toggle** para material complementario.  
- **Tablas** en caso de datos comparativos.  
- **Espacio de preguntas/palabras clave** para facilitar la recuperación activa.  

📌 **IMPORTANTE**: 
- Asegúrate de que el contenido mantenga **toda la información relevante** del documento original.

💡 **Formato en Notion**:

\`\`\`markdown
# Por qué se llaman ciencias formales  

## Definición y Características  

**Pregunta clave:** ¿Qué distingue a las ciencias formales de las empíricas?  

Las ciencias formales son aquellas que estudian sistemas abstractos independientes de la realidad física, como la lógica y la matemática.  

> **Definición**: Se consideran **ciencias puras** porque su validez no depende de la observación, sino de la coherencia lógica de sus principios y métodos.  

🔹 **Ejemplos de ciencias formales:**  
- Matemática  
- Lógica  
- Teoría de conjuntos  

▼ **Diferencias con las ciencias empíricas**  
   - **Ciencias formales**: Se basan en axiomas y deducciones lógicas.  
   - **Ciencias empíricas**: Dependen de la observación y el método científico experimental.  

## Fundamentos y Aplicaciones  

📌 **Pregunta clave:** ¿Cómo se aplican las ciencias formales en otras disciplinas?  

Las ciencias formales proporcionan herramientas para modelar fenómenos en diversas áreas del conocimiento.  

💡 **Ejemplo práctico**:  
Las ecuaciones matemáticas se utilizan en la física para describir el movimiento de los cuerpos.  

💡 **Resumen final (Callout)**  
📢 Las ciencias formales son disciplinas que trabajan con sistemas abstractos basados en la lógica y la matemática. Son fundamentales para la estructuración del conocimiento en distintas áreas, aunque no dependen de la experimentación empírica.  

\`\`\`markdown
---

Este prompt asegurará que el resumen sea **claro, visualmente atractivo y optimizado para el aprendizaje**, aprovechando todas las funciones de Notion. RECUERDA: el resumen debe ser al menos 3 veces más extenso de lo normal, con explicaciones detalladas y completas de cada tema.`,
    flashcardPrompt: `Detecta el idioma del contenido proporcionado (ya sea texto, PDF, imagen o combinación) y genera tarjetas de estudio en ese mismo idioma.

Instrucciones específicas:
1. Analiza cuidadosamente todo el contenido proporcionado (incluyendo texto e imágenes o documentos PDF si están presentes)
2. Extrae los conceptos clave, definiciones, fórmulas y datos importantes
3. Genera un conjunto de tarjetas de estudio en formato TSV (valores separados por tabuladores) para importar a Quizlet
4. Cada tarjeta debe incluir:
   - Anverso: Una pregunta clara o concepto a recordar
   - Reverso: La respuesta completa o explicación
5. Formato técnico:
   - Separa el anverso y reverso con un tabulador (\t)
   - Cada tarjeta en una línea separada (no incluyas saltos de línea dentro de una tarjeta)
   - NO incluyas "Front\tBack" como primera línea
   - Da formato a términos importantes con *asteriscos* para indicar énfasis
6. Contenido:
   - Crea entre 15-25 tarjetas que cubran los conceptos más importantes del material
   - Las tarjetas deben ser concisas pero completas
   - Evita información redundante entre tarjetas
   - Incluye todo tipo de contenido relevante: definiciones, ejemplos, aplicaciones, comparaciones

No incluyas explicaciones adicionales, solo proporciona el formato TSV listo para importar a Quizlet.
`
};