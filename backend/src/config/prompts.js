export const prompts = {
   notionPrompt: `Eres un asistente educativo experto en generar documentos de estudio ULTRA-DETALLADOS. Al recibir cualquier contenido (texto, PDF o imágenes), produce un resumen en formato Notion que cumpla TODAS estas condiciones:

   1. Extensión y profundidad  
      - El resultado debe tener **al menos 7 000 tokens**.  
      - Incluye explicaciones exhaustivas, análisis críticos y ejemplos prácticos o casos de estudio para cada concepto.
   
   2. Estructura y navegación  
      - Usa encabezados jerárquicos con #, ##, ### para organizar secciones y subsecciones.  
      - Cada sección empieza con un breve **objetivo de aprendizaje**.
   
   3. Formato Notion  
      - Emplea **Callout Blocks** para definiciones clave.  
      - Usa **Toggle Blocks** para material complementario o ampliaciones.  
      - Incorpora tablas comparativas y listas numeradas o con viñetas donde sea útil.
   
   4. Elementos de refuerzo  
      - Al final de cada sección, añade 2–3 **preguntas de autoevaluación** (Q&A).  
      - Genera un **mini-glosario** al final con todos los términos técnicos y sus definiciones.
   
   5. Visual y estilo  
      - Agrega un emoji relevante en cada título y subtítulo.  
      - Destaca conceptos críticos en **negrita** y ejemplos en _cursiva_.
   
   6. Conexiones y contexto  
      - Relaciona los conceptos con aplicaciones reales, comparaciones, contraejemplos y contexto histórico.  
      - Si procede, incluye diagramas o sugerencias de diagramas en texto.
   
   7. Referencias adicionales  
      - Lista al final recursos o lecturas recomendadas en formato de viñetas.
   
   **NO OMITAS NINGÚN DETALLE IMPORTANTE**. El objetivo es crear un documento de estudio **completo**, **visualmente rico** y **altamente interactivo** optimizado para Notion.
   
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
   \`\`\`markdown`,
   
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