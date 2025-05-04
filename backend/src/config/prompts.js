export const prompts = {
  notionPrompt: `Utilizando el formato establecido en el archivo **"formatoNotion"**, elabora un resumen EXTENSO Y DETALLADO de los documentos que suba junto a este txt. Este resumen debe ser al menos 3 veces más largo que el resumen estándar, incluyendo explicaciones detalladas, ejemplos adicionales, análisis profundo y conexiones entre conceptos. NO omitas ningún detalle importante.

📌 **INSTRUCCIÓN ADICIONAL**:  
- Utiliza emojis de forma liberada para resaltar secciones, conceptos y ejemplos (por ejemplo: 🔥, ✅, 🎯, 🤔).  
- Asegúrate de que cada sección y subtítulo incluya al menos un emoji relevante.

Aquí un ejemplo del formato que debe seguir cada uno de los temas presentado por tu resumen:

🔹 **Requisitos clave**:  
- **Formato Cornell Notes** con encabezados jerárquicos para claridad.  
- **Destaque de conceptos clave** con negritas.  
- **Citas o definiciones** con formato de cita (`>`).  
- **Bloques de Callout** para información crítica o resúmenes.  
- **Listas y viñetas** para mejorar la organización.  
- **Bloques Toggle** para material complementario.  
- **Tablas** en caso de datos comparativos.  
- **Espacio de preguntas/palabras clave** para facilitar la recuperación activa.  

📌 **IMPORTANTE**: 
- Asegúrate de que el contenido mantenga **toda la información relevante** del documento original.
- EXPANDE cada sección con explicaciones adicionales, ejemplos prácticos y conexiones con otros conceptos.
- PROFUNDIZA en cada tema incluyendo subtemas que normalmente podrían omitirse.
- INCLUYE más ejemplos de los que normalmente incluirías.
- AÑADE secciones de "Análisis profundo" donde sea relevante.
- Las respuestas deben ser MUY EXTENSAS para garantizar una comprensión completa del tema.
- NO RESUMAS EXCESIVAMENTE. El objetivo es expandir, no condensar.

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
  
  flashcardPrompt: `Give the output as a MarkDown ready to copy, not text. Do not include "Front	Back" as the first line. Using the provided data, generate a COMPREHENSIVE and EXTENSIVE set of flashcards in a tab-separated format for importing into Quizlet.

IMPORTANT INSTRUCTIONS FOR LENGTH AND DETAIL:
- Create at least 3 times more flashcards than you normally would
- Each flashcard should include DETAILED explanations on the back side
- Include examples, counterexamples, and edge cases where applicable
- On the back of cards, expand concepts with additional context and related information
- Create separate cards for subtopics that would typically be grouped together
- Include cards that explore deeper implications and connections between concepts

// IMPORTANT INSTRUCTIONS FOR EMOJIS:
- Add emojis to each flashcard front to illustrate the topic (ej. 📝, ❓, 🔍).
- On the back of each card, usa emojis que acompañen el contenido (por ejemplo: 💡, 🔑, ⚠️).

Each flashcard should include a front and a back that present clear, coherent, and well-structured concepts—avoid isolated words. Do not use newline characters within a flashcard's content (each newline indicates a new flashcard). Enhance the important terms by denoting them with single asterisks at the start and end of the text to be bolded.

Do not focus on brevity - the priority is comprehensive understanding through multiple detailed flashcards.

Data:
`
};