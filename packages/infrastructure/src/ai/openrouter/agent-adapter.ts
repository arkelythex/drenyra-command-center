/**
 * OpenRouter Agent Adapter
 * 
 * Connects ARKELYTHEX 100 agents to OpenRouter API
 * Each agent gets optimal LLM model selection
 * 
 * @since 2026.1.0
 */

import { Agent, Task, AgentResult } from '../../../agent-swarm/src/core/orchestrator-2026.js';
import { openRouter, OpenRouterTool } from './index.js';
import { SecureLogger } from '@drenyra/shared/secure-logger';

/**
 * System prompts for each agent type
 */
const SYSTEM_PROMPTS: Record<string, string> = {
  'security-audit-agent': `You are a Security Audit Agent specialized in detecting vulnerabilities in code.
Analyze the provided code for:
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) attacks
- CSRF (Cross-Site Request Forgery) issues
- Data exposure risks
- Insecure dependencies

Provide specific line numbers, severity levels (critical/high/medium/low), and actionable recommendations.
Format your response as JSON with findings array.`,

  'quality-analyzer-agent': `You are a Code Quality Analyzer specialized in software engineering best practices.
Analyze code for:
- SOLID principles compliance
- Cyclomatic complexity
- Code duplication
- File size limits (200 lines)
- Function complexity
- Type safety (no 'any' usage)

Provide a quality score (0-100) and specific issues with recommendations.`,

  'performance-analyzer-agent': `You are a Performance Analyzer specialized in optimization.
Analyze code for:
- Algorithmic complexity (Big O notation)
- N+1 query problems
- Memory leaks
- Unnecessary re-renders
- Database anti-patterns

Identify bottlenecks and suggest optimizations with expected performance gains.`,

  'code-generator-agent': `You are a Code Generation Agent specialized in creating production-ready TypeScript code.
Generate code that follows:
- ARKELYTHEX coding standards
- Vertical Slice Architecture
- Clean Architecture principles
- TypeScript strict mode
- 200 line file limit
- JSDoc documentation

Generate complete, working code with proper error handling.`,

  'documentation-agent': `You are a Documentation Agent specialized in technical writing.
Create comprehensive documentation including:
- JSDoc comments with @param, @returns, @throws, @example
- README files with usage examples
- Architecture Decision Records (ADRs)
- API documentation
- Mermaid diagrams

Follow ARKELYTHEX documentation standards.`,

  'sunat-compliance-agent': `You are a SUNAT Compliance Agent specialized in Peruvian tax regulations.
Validate documents for:
- SUNAT 2026 compliance
- RUC validation
- XML UBL 2.1 format
- Digital signature requirements
- SPOT (Sistema de Pago de Obligaciones Tributarias) calculations

Ensure full compliance with Peruvian tax authority requirements.`,

  'tax-optimizer-agent': `You are a Tax Optimization Agent specialized in Peruvian tax law.
Analyze financial situations and suggest:
- Legal tax deductions
- IGV optimization strategies
- Income tax planning
- Retention optimization
- SPOT calculation validation

Focus on legal tax optimization within SUNAT 2026 framework.`,

  'financial-analyzer-agent': `You are a Financial Analysis Agent specialized in ERP financial data.
Analyze:
- Balance sheets
- Income statements
- Cash flow
- Financial ratios
- Trends and forecasts

Provide professional financial analysis with actionable insights.`,

  'default': `You are an ARKELYTHEX Agent specialized in fiscal intelligence for Peruvian businesses.
Follow best practices:
- SUNAT 2026 compliance
- Clean Architecture
- TypeScript strict mode
- Security first
- Performance optimized

Provide accurate, helpful responses.`,
};

/**
 * Create OpenRouter-powered agent
 * @param baseAgent - Input for baseAgent.
 * @param options - Input for options.
 * @returns Result of createOpenRouterAgent.
 * @example
 * ```ts
 * const result = createOpenRouterAgent({} as Agent, {});
 * console.log(result);
 * ```
 */

export function createOpenRouterAgent(
  baseAgent: Agent,
  options?: {
    tools?: OpenRouterTool[];
    temperature?: number;
    maxTokens?: number;
  }
): Agent {
  return {
    ...baseAgent,
    
    async execute(task: Task): Promise<AgentResult> {
      const startTime = Date.now();
      
      try {
        // Get system prompt for this agent
        const systemPrompt = SYSTEM_PROMPTS[baseAgent.id] || SYSTEM_PROMPTS['default'];
        
        // Prepare user prompt from task
        const userPrompt = typeof task.data === 'string' 
          ? task.data 
          : JSON.stringify(task.data, null, 2);

        // Execute through OpenRouter
        const response = await openRouter.executeAgentTask(
          baseAgent.id,
          systemPrompt,
          userPrompt,
          options?.tools
        );

        // Parse LLM response
        const content = response.choices[0]?.message?.content || '';
        let parsedData: Record<string, unknown>;

        try {
          // Try to parse as JSON
          parsedData = JSON.parse(content);
        } catch {
          // If not JSON, return as text
          parsedData = { analysis: content };
        }

        // Track cost
        const costMetrics = openRouter.getCostMetrics();
        
        SecureLogger.info('Agent execution via OpenRouter', {
          agentId: baseAgent.id,
          model: response.model,
          tokens: response.usage.total_tokens,
          cost: response.usage.cost,
          budgetRemaining: costMetrics.budgetRemaining,
        });

        return {
          agentId: baseAgent.id,
          taskId: task.id,
          success: true,
          data: {
            ...parsedData,
            _meta: {
              model: response.model,
              tokens: response.usage.total_tokens,
              cost: response.usage.cost,
            },
          },
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      } catch (error) {
        SecureLogger.error('Agent execution failed', {
          agentId: baseAgent.id,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          agentId: baseAgent.id,
          taskId: task.id,
          success: false,
          data: null,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          errors: [error instanceof Error ? error.message : String(error)],
        };
      }
    },
  };
}

/**
 * Batch execute multiple agents through OpenRouter
 * @param tasks - Input for tasks.
 * @param options - Input for options.
 * @returns Result of batchExecuteAgents.
 * @example
 * ```ts
 * const result = await batchExecuteAgents({} as Array, {});
 * console.log(result);
 * ```
 */

export async function batchExecuteAgents(
  tasks: Array<{ agent: Agent; task: Task }>,
  options?: {
    maxConcurrent?: number;
  }
): Promise<AgentResult[]> {
  const maxConcurrent = options?.maxConcurrent || 5;
  const results: AgentResult[] = [];
  
  // Process in batches
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent);
    
    const batchResults = await Promise.all(
      batch.map(({ agent, task }) => {
        const enhancedAgent = createOpenRouterAgent(agent);
        return enhancedAgent.execute(task);
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Get cost summary for all OpenRouter usage
 * @returns Result of getOpenRouterCostSummary.
 * @example
 * ```ts
 * const result = getOpenRouterCostSummary();
 * console.log(result);
 * ```
 */

export function getOpenRouterCostSummary(): {
  totalCost: number;
  budgetRemaining: number;
  topModels: Array<{ model: string; cost: number }>;
  topProviders: Array<{ provider: string; cost: number }>;
} {
  const metrics = openRouter.getCostMetrics();
  
  // Sort models by cost
  const topModels = Array.from(metrics.modelBreakdown.entries())
    .map(([model, stats]) => ({ model, cost: stats.cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
  
  // Sort providers by cost
  const topProviders = Array.from(metrics.providerBreakdown.entries())
    .map(([provider, stats]) => ({ provider, cost: stats.cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
  
  return {
    totalCost: metrics.totalCost,
    budgetRemaining: metrics.budgetRemaining,
    topModels,
    topProviders,
  };
}

/**
 * Check if within budget with warning threshold
 * @param warningThreshold - Input for warningThreshold.
 * @returns Result of checkBudgetStatus.
 * @example
 * ```ts
 * const result = checkBudgetStatus(undefined);
 * console.log(result);
 * ```
 */

export function checkBudgetStatus(warningThreshold = 0.8): {
  status: 'ok' | 'warning' | 'exceeded';
  remaining: number;
  percentage: number;
} {
  const metrics = openRouter.getCostMetrics();
  const percentage = metrics.totalCost / metrics.monthlyBudget;
  
  let status: 'ok' | 'warning' | 'exceeded';
  if (percentage >= 1) {
    status = 'exceeded';
  } else if (percentage >= warningThreshold) {
    status = 'warning';
  } else {
    status = 'ok';
  }
  
  return {
    status,
    remaining: metrics.budgetRemaining,
    percentage: percentage * 100,
  };
}
