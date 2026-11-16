import type { Context } from '@deepseek-ai/cordis'
export declare const name: string
export declare const inject: string[]
export interface Config {
  baseURL: string
  model: string
  apiKeyEnv: string
  apiKeyRef?: string
  defaultSize: string
  maxCount: number
  timeoutMs: number
  outputDir?: string
}
export declare function apply(ctx: Context, config: Config): Promise<void>
