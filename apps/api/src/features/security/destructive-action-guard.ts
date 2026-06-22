const OVERRIDE_ROLES = new Set(['owner', 'admin', 'superadmin', 'senior']);

const BLOCKED_PATTERNS: Record<
  string,
  {
    pattern: RegExp;
    requiresOverride?: boolean;
  }
> = {
  DELETE_LEDGER: {
    pattern: /(?:borrar|eliminar|delete).*(?:libro.*mayor|ledger|asientos.*contables)/i,
  },
  DROP_TABLE: {
    pattern: /(?:drop|truncate|eliminar.*tabla|delete.*table)/i,
  },
  DELETE_ALL: {
    pattern: /(?:borrar.*todo|eliminar.*todo|delete.*all|truncate.*database)/i,
  },
  OVERRIDE_FISCAL: {
    pattern: /(?:override|modificar|cambiar).*(?:igv|sunat|impuesto|factura.*electronica)/i,
    requiresOverride: true,
  },
  DISABLE_AUDIT: {
    pattern: /(?:desactivar|disable|eliminar).*(?:audit|log|registro.*auditoria)/i,
  },
  MODIFY_TAX_DATA: {
    pattern: /(?:modificar|cambiar|editar).*(?:datos.*tributarios|ruc|registros.*sunat)/i,
    requiresOverride: true,
  },
  EXPORT_SENSITIVE: {
    pattern: /(?:exportar|descargar|dump|export).*(?:contraseñas|passwords|credenciales|keys|secretos)/i,
  },
};

/**
 * Minimal chat message shape used to inspect the latest user prompt for destructive intent.
 *
 * @example
 * ```ts
 * const msg: ChatMessage = { role: 'user', content: 'Elimina el libro mayor' };
 * ```
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Policy decision returned after evaluating a prompt for destructive actions.
 *
 * @example
 * ```ts
 * const result: DestructiveGuardResult = {
 *   allowed: false,
 *   code: 'DESTRUCTIVE_ACTION_BLOCKED',
 *   reason: 'Blocked',
 *   requiresAdminOverride: false,
 * };
 * ```
 */
export type DestructiveGuardResult =
  | {
      allowed: true;
      blockedKeyword?: string;
      requiresAdminOverride: boolean;
    }
  | {
      allowed: false;
      code: 'DESTRUCTIVE_ACTION_BLOCKED' | 'ADMIN_OVERRIDE_REQUIRED';
      reason: string;
      blockedKeyword?: string;
      requiresAdminOverride: boolean;
    };

/**
 * Inspects the latest user message and blocks destructive operations unless an allowed override applies.
 *
 * @param messages - Chat transcript ordered by time, from which the latest user message is inspected.
 * @param role - Caller role used to determine whether an override is permitted.
 * @param overrideEnabled - Whether the caller explicitly enabled override mode for this request.
 * @returns A normalized allow/deny decision for the current prompt.
 * @example
 * ```ts
 * const result = guardDestructivePrompt(
 *   [{ role: 'user', content: 'delete all data' }],
 *   'viewer',
 *   false,
 * );
 * ```
 */
export function guardDestructivePrompt(
  messages: ChatMessage[],
  role: string,
  overrideEnabled: boolean,
): DestructiveGuardResult {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  if (!latestUserMessage) {
    return {
      allowed: true,
      requiresAdminOverride: false,
    };
  }

  const prompt = latestUserMessage.content.toLowerCase();

  for (const [action, config] of Object.entries(BLOCKED_PATTERNS)) {
    if (!config.pattern.test(prompt)) continue;

    const requiresOverride = Boolean(config.requiresOverride);
    const canOverride = requiresOverride && OVERRIDE_ROLES.has(role.toLowerCase()) && overrideEnabled;

    if (canOverride) {
      return {
        allowed: true,
        blockedKeyword: action,
        requiresAdminOverride: true,
      };
    }

    return {
      allowed: false,
      code: requiresOverride ? 'ADMIN_OVERRIDE_REQUIRED' : 'DESTRUCTIVE_ACTION_BLOCKED',
      reason: `Accion bloqueada por politica de seguridad: ${action}.`,
      blockedKeyword: action,
      requiresAdminOverride: requiresOverride,
    };
  }

  return {
    allowed: true,
    requiresAdminOverride: false,
  };
}
