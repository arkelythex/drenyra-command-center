# Crítica obsesiva: Análisis UX de Drenyra (round 1)

**Last updated**: 2026-07-14
**Content type**: Critique / Post-mortem

## Puntaje: 6/10

Esto es una crítica a mi **propio** análisis UX anterior de Drenyra. No al producto, ni al equipo — a mi entrega. La escribo para no repetir los mismos errores.

## Lo que falló

### 1. Supply-side only, cero user research

El análisis fue un inventario de componentes disfrazado de estrategia UX. Listé patrones de UI que *podríamos* construir sin haber hablado con UN solo contador, fiscalista, o auditor. No hay journey maps, no hay pain points validados, no hay ni una sombra de research etnográfico.

**Duele porque**: Drenyra es para contadores peruanos que lidian con SUNAT, SIRE, detracciones, y CDR. Gente que usa Spotify y TikTok — no necesitan un "panel tipo Bloomberg". Necesitan detectar un problema fiscal, entenderlo, resolverlo, y probar que lo resolvieron.

### 2. Taxonomía de Codex copiada literalmente

Agarré los 9 acentos de Codex (speed, trust, flow, etc.) y los calcqué como si fueran universales. Codex es un editor de código. Drenyra es un sistema fiscal. Son dominios completamente diferentes. La taxonomía hay que crearla desde el dominio fiscal, no importarla de una herramienta de developer tools.

### 3. Three-panel layout como shell universal

Propuse un layout de tres paneles (sidebar + main + detail) como estructura *default* para TODO. Eso es una solución de diseño buscando problemas. No todas las tareas fiscales necesitan tres columnas. Una reconciliación bancaria no se ve igual que un panel de control de detracciones.

### 4. Fiscal Health Score — peligroso

Un score compuesto que mezcla caché de CDR, antigüedad de deuda, y actividad de SIRE en un solo número es engañoso y potencialmente dañino. Un contador necesita precisión, no una simplificación peligrosa. "Tu salud fiscal es 72/100" no paga una deuda ni evita una multa.

### 5. Confianza sin evidencia

Propuse mostrar "confianza" en recomendaciones AI sin mostrar la fuente, el razonamiento, ni el nivel de seguridad. Eso es exactamente lo opuesto a lo que un sistema fiscal necesita. La confianza en fiscalidad SE DEMUESTRA, no se declara.

### 6. Nueve acentos son demasiados

Nueve principios de diseño es una lista de compras, no una estrategia. Cuando todo es prioritario, nada lo es. Un sistema fiscal necesita 3-5 principios máximo, cada uno con consecuencias de diseño verificables.

### 7. Elecciones estéticas sin justificación funcional

"Glassmorphism", pergaminos, OLED mode — decisiones puramente visuales sin conexión con problemas reales de los usuarios. La estética debe servir a la comprensión fiscal, no al portfolio de Dribbble.

### 8. Ingeniería frontal ausente

No mencioné:
- Tamaño de bundles y code splitting
- Performance en tablas de 10,000+ filas (algo que TODO sistema fiscal necesita)
- Accesibilidad (contraste, navegación por teclado, lectores de pantalla)
- Virtualización de listas
- Estrategia de offloading de cómputo pesado a workers

## Thesis central

> Drenyra debería verse menos como un demo de agente AI y más como un sistema fiscal inevitablemente confiable.

Un contador no necesita "sorpresa y deleite". Necesita: ¿esto está bien? ¿estoy seguro? ¿puedo demostrarlo?

## North star corregido

> ¿Cómo logramos que un contador **detecte**, **entienda**, **resuelva** y **pruebe** un problema fiscal con el mínimo riesgo?

Esa es la pregunta que debería guiar cada decisión de UX en Drenyra. No "cómo se ve". Sino "cómo se comporta cuando algo sale mal".

## Lo que salió bien (para no ser tan duro)

- Identificar que Drenyra no es un ERP genérico con chatbot — eso está correcto
- La dirección de hacer visible la verdad fiscal, no esconderla tras AI
- Reconocer que los agentes deben operar con supervisión humana
- Señalar que el modelo mental no es "dashboard" sino "puesto de comando fiscal"
- La distinción entre lo que Drenyra es (fiscal intelligence platform) vs lo que parece ser
