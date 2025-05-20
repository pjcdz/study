export const prompts = {
  notionPrompt: `Utilizando el formato establecido en el archivo **"formatoNotion"**, elabora un resumen EXTENSO Y DETALLADO de los documentos que suba junto a este txt. Este resumen debe ser al menos 3 veces más largo que el resumen estándar, incluyendo explicaciones detalladas, ejemplos adicionales, análisis profundo y conexiones entre conceptos. NO omitas ningún detalle importante.

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

📌 **Pregunta clave:** ¿Qué distingue a las ciencias formales de las empíricas?  

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
  
  flashcardPrompt: `Detect the language of the provided Notion markdown content and generate the flashcards in the same language.
 Give the output as a MarkDown ready to copy, not text. Do not include "Front\tBack" as the first line. Using the provided data, generate a set of flashcards in a tab-separated format for importing into Quizlet. Each flashcard should include a front and a back that present clear, coherent, and well-structured concepts—avoid isolated words. Do not use newline characters within a flashcard's content (each newline indicates a new flashcard). Enhance the important terms by denoted by single asterisks at the start and end of the text to be bolded. Flashcards should be short, even if it takes more cards.Reduce the number of flashcards to just the most relevant information that could be on an exam. Data:
`
};