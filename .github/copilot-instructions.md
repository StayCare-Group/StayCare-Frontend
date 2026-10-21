# Contexto y Reglas del Proyecto

Las reglas completas están en `.agents/rules/` (para Antigravity) y se resumen aquí.
Contexto de negocio: `docs/PROJECT_CONTEXT.md`. Estándares de UI: `docs/FRONTEND_GUIDELINES.md`.

## 1. Perfil del Proyecto
* **Tecnologías:** Vue 3, Vite, Tailwind CSS, Pinia, vue-i18n, TypeScript/JavaScript.
* **Arquitectura:** capas `api/` (HTTP), `utils/` (lógica pura), `stores/`, `composables/` y `Components/`. Conservar la arquitectura existente.

## 2. Estilo de Código y Convenciones
* Usar nombres de variables y funciones en inglés y camelCase.
* Priorizar funciones puras y componentes pequeños con una sola responsabilidad.
* Todo texto visible usa i18n (`en.json` y `es.json` con las mismas claves).

## 3. Manejo de errores
* NO usar `console.log` ni `console.error` para reportar errores.
* NO usar `alert()` ni `confirm()`.
* Mostrar los errores con `ui.showError(formatApiErrorMessage(err, t('feature.fallbackErrorKey'), t))`.
* Confirmaciones con `AppModal.vue` y `AppButton.vue`.

## 4. Restricciones
* NO utilices librerías externas adicionales sin preguntar.
* NO generes código obsoleto (deprecated).
* NO generes código que no cumpla con las reglas de estilo y convenciones del proyecto.
* NO agregues validaciones innecesarias a los componentes, solo las necesarias para el correcto funcionamiento.
* NO agregues comentarios innecesarios, solo los necesarios para la comprensión del código.