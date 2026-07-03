/**
 * SkillCapability — a single executable capability within a skill
 *
 * @example
 * const cap: SkillCapability = {
 *   id: "cap-1",
 *   name: "Validar RUC",
 *   description: "Consulta estado, condición y domicilio de un RUC",
 *   actionType: "sunat:validate-ruc",
 * };
 */

export interface SkillCapability {
	id: string;
	name: string;
	description: string;
	actionType: string;
}
