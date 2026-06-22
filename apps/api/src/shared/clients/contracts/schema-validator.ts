export interface JsonSchemaLike {
  type: "object" | "array" | "string" | "number" | "boolean";
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(
  value: unknown,
  schema: JsonSchemaLike,
  path = "root"
): SchemaValidationResult {
  const errors: string[] = [];
  checkNode(value, schema, path, errors);
  return { valid: errors.length === 0, errors };
}

function checkNode(
  value: unknown,
  schema: JsonSchemaLike,
  path: string,
  errors: string[]
): void {
  if (schema.type === "object") {
    checkObject(value, schema, path, errors);
    return;
  }
  if (schema.type === "array") {
    checkArray(value, schema, path, errors);
    return;
  }
  checkScalar(value, schema, path, errors);
}

function checkObject(
  value: unknown,
  schema: JsonSchemaLike,
  path: string,
  errors: string[]
): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path}: expected object, got ${typeof value}`);
    return;
  }

  const record = value as Record<string, unknown>;
  for (const field of schema.required ?? []) {
    if (!(field in record)) {
      errors.push(`${path}.${field}: required field missing`);
    }
  }

  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    if (!(key in record)) continue;
    checkNode(record[key], propSchema, `${path}.${key}`, errors);
  }
}

function checkArray(
  value: unknown,
  schema: JsonSchemaLike,
  path: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path}: expected array, got ${typeof value}`);
    return;
  }
  if (!schema.items) return;

  value.forEach((item, index) => {
    checkNode(item, schema.items as JsonSchemaLike, `${path}[${index}]`, errors);
  });
}

function checkScalar(
  value: unknown,
  schema: JsonSchemaLike,
  path: string,
  errors: string[]
): void {
  if (typeof value !== schema.type) {
    errors.push(`${path}: expected ${schema.type}, got ${typeof value}`);
    return;
  }

  if (schema.type === "number") {
    const numericValue = value as number;
    if (typeof schema.minimum === "number" && numericValue < schema.minimum) {
      errors.push(`${path}: expected number >= ${schema.minimum}, got ${numericValue}`);
    }
    if (typeof schema.maximum === "number" && numericValue > schema.maximum) {
      errors.push(`${path}: expected number <= ${schema.maximum}, got ${numericValue}`);
    }
  }

  if (schema.enum && !schema.enum.includes(String(value))) {
    errors.push(`${path}: value "${String(value)}" not in enum ${JSON.stringify(schema.enum)}`);
  }
}
