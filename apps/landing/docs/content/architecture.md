# Arquitectura del Sistema

Arkelythex utiliza una arquitectura de vanguardia diseñada para la soberanía financiera y el cumplimiento automatizado.

## High-Level Architecture

Nuestra estructura divide claramente las responsabilidades para asegurar escalabilidad y seguridad total:

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>React 19 + TanStack]
        MOBILE[Mobile Web<br/>Responsive PWA]
      end

    subgraph "API Layer"
        ELYSIA[ElysiaJS API Gateway<br/>BetterAuth + Rate Limit]
    end

    subgraph "Domain Layer"
        CORE[Domain Core<br/>Pure TypeScript]
        MONEY[Money Class<br/>BigInt Precision]
        TAX[Tax Calculator<br/>SUNAT 2026]
    end

    subgraph "Infrastructure Layer"
        DRIZZLE[Drizzle ORM]
        NATS[NATS JetStream<br/>Event Bus]
        AI[OpenRouter<br/>AI Adapters]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL 15<br/>Financial Data)]
        EVENTS[(NATS Streams<br/>Events)]
    end

    WEB -->|Eden Treaty| ELYSIA
    MOBILE -->|Eden Treaty| ELYSIA
    ELYSIA --> CORE
    CORE --> MONEY
    CORE --> TAX
    CORE --> DRIZZLE
    CORE --> NATS
    CORE --> AI
    DRIZZLE --> POSTGRES
    NATS --> EVENTS
```

## Flujo de Facturación Electrónica

El proceso de creación y firma de documentos sigue un flujo asíncrono y seguro:

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant D as Domain Core
    participant DB as PostgreSQL
    participant E as Event Bus

    U->>F: Rellena formulario
    F->>A: POST /invoices
    A->>D: CreateInvoiceCommand
    D->>D: Cálculo BigInt + Reglas
    D->>DB: Persistencia Drizzle
    D->>E: Publicar invoice.created
    D-->>A: InvoiceDTO
    A-->>F: Éxito UI
    
    Note over E: Firma Digital WASM:
    E->>E: Generar XML UBL 2.1
    E->>E: Firma RSA-SHA256 (Rust)
    E->>E: Almacenamiento Seguro
```

## Decisiones Técnicas (ADRs)

Operamos bajo el principio de **Liderazgo Técnico Documentado**:

1.  **Firma XML Nativa**: Implementación propia en Rust/WASM para eliminar la dependencia de PSEs externos y reducir costos transaccionales a cero.
2.  **Bun vs Node**: Migramos a Bun para obtener un 3x de rendimiento en el runtime y una gestión de dependencias ultraveloz.
3.  **Vertical Slicing**: Organizamos el código por funcionalidades (features) en lugar de capas técnicas, mejorando la mantenibilidad a largo plazo.

---
> [!TIP]
> Esta arquitectura permite a Arkelythex manejar picos de facturación de fin de mes sin degradación de servicio, gracias a su motor asíncrono basado en eventos.
