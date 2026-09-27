export class IntentDetector {
    rules = [];
    constructor() {
        this.registerDefaultRules();
    }
    register(rule) {
        this.rules.push(rule);
        this.rules.sort((a, b) => b.priority - a.priority);
    }
    async detectIntent(input, _context) {
        const normalized = input.toLowerCase().trim();
        for (const rule of this.rules) {
            if (rule.pattern.test(normalized)) {
                return {
                    agent: rule.agent,
                    tool: rule.tool,
                    confidence: 1.0,
                    originalInput: input,
                };
            }
        }
        return {
            agent: "ai-assistant",
            tool: "general",
            confidence: 0.3,
            originalInput: input,
        };
    }
    registerDefaultRules() {
        const rules = [
            {
                pattern: /\b(invoice|factura|bill|pago|payment)\b/i,
                agent: "finance",
                tool: "invoice",
                priority: 50,
            },
            {
                pattern: /\b(balance|account|cuenta|ledger|libro)\b/i,
                agent: "finance",
                tool: "account",
                priority: 50,
            },
            {
                pattern: /\b(cashflow|flujo|efectivo|cash)\b/i,
                agent: "finance",
                tool: "cashflow",
                priority: 50,
            },
            {
                pattern: /\b(reconcil|conciliación|match)\b/i,
                agent: "finance",
                tool: "reconciliation",
                priority: 50,
            },
            {
                pattern: /\b(igv|vat|tax|impuesto)\b/i,
                agent: "compliance",
                tool: "igv",
                priority: 80,
            },
            {
                pattern: /\b(sunat|sire|ple)\b/i,
                agent: "compliance",
                tool: "sire",
                priority: 90,
            },
            {
                pattern: /\b(detraccion|spot|detraction)\b/i,
                agent: "compliance",
                tool: "detraction",
                priority: 80,
            },
            {
                pattern: /\b(retencion|withholding)\b/i,
                agent: "compliance",
                tool: "retention",
                priority: 80,
            },
            {
                pattern: /\b(ruc|dni|tax.id|contribuyente)\b/i,
                agent: "compliance",
                tool: "ruc",
                priority: 80,
            },
            {
                pattern: /\b(cpe|factura\s*electrónica|boleta|xml.*ubl)\b/i,
                agent: "compliance",
                tool: "cpe",
                priority: 80,
            },
            {
                pattern: /\b(audit|auditoría|auditar)\b/i,
                agent: "compliance",
                tool: "audit",
                priority: 70,
            },
            {
                pattern: /\b(customer|cliente|proveedor|vendor|supplier)\b/i,
                agent: "operations",
                tool: "counterparty",
                priority: 50,
            },
            {
                pattern: /\b(stock|inventory|inventario|product|producto)\b/i,
                agent: "operations",
                tool: "inventory",
                priority: 50,
            },
            {
                pattern: /\b(settings|configuración|config|setup)\b/i,
                agent: "system-admin",
                tool: "settings",
                priority: 40,
            },
            {
                pattern: /\b(profile|perfil|user|usuario)\b/i,
                agent: "system-admin",
                tool: "profile",
                priority: 40,
            },
            {
                pattern: /\b(integration|integracion|api.key|webhook)\b/i,
                agent: "system-admin",
                tool: "integration",
                priority: 40,
            },
            {
                pattern: /\b(cerno|see|vision|overview)\b/i,
                agent: "cerno",
                tool: "vision",
                priority: 60,
            },
            {
                pattern: /\b(custos|guard|protect|security)\b/i,
                agent: "custos",
                tool: "guard",
                priority: 60,
            },
            {
                pattern: /\b(necto|connect|link|integration)\b/i,
                agent: "necto",
                tool: "connect",
                priority: 60,
            },
            {
                pattern: /\b(regula|rule|norm|policy|regulation)\b/i,
                agent: "regula",
                tool: "regulate",
                priority: 60,
            },
            {
                pattern: /\b(lumen|insight|analytics|report)\b/i,
                agent: "lumen",
                tool: "insight",
                priority: 60,
            },
            {
                pattern: /\b(fusio|merge|consolidate|unify)\b/i,
                agent: "fusio",
                tool: "consolidate",
                priority: 60,
            },
            {
                pattern: /\b(scripta|document|record|write)\b/i,
                agent: "scripta",
                tool: "document",
                priority: 60,
            },
            {
                pattern: /\b(capsa|store|archive|save|backup)\b/i,
                agent: "capsa",
                tool: "store",
                priority: 60,
            },
        ];
        for (const rule of rules) {
            this.register(rule);
        }
    }
    getRules() {
        return [...this.rules];
    }
}
//# sourceMappingURL=intent-detector.js.map