/**
 * Formats API errors into user-friendly localized messages.
 * Replaces cryptic backend error strings (such as "Validation failed")
 * or Zod issues with clear form completion instructions.
 *
 * @param err The caught error object
 * @param fallbackMessage Fallback text or key if no specific message is extracted
 * @param t Optional i18n translation function
 */
export function formatApiErrorMessage(
  err: any,
  fallbackMessage: string,
  t?: (key: string) => string
): string {
  const rawMessage = String(
    err?.message || err?.error || err?.data?.message || ''
  ).trim()

  const isValidationFailed =
    rawMessage.toLowerCase().includes('validation failed') ||
    (Array.isArray(err?.data) && err.data.length > 0) ||
    (Array.isArray(err?.issues) && err.issues.length > 0)

  if (isValidationFailed) {
    return t
      ? t('validation.fillRequiredFields')
      : 'Por favor completa todos los campos requeridos del formulario.'
  }

  return rawMessage || fallbackMessage
}
