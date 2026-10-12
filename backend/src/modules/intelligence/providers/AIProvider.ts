/** Isolated model call. Implementations must not persist or execute workflows. */
export interface AIProvider {
  readonly id: string;
  isConfigured(): boolean;
  /** Returns the raw model text. Must not include the API key in thrown errors. */
  complete(userPrompt: string): Promise<string>;
}
