export type NavigationTab =
  | 'overview'
  | 'dataset-laboratory'
  | 'synthetic-generation'
  | 'model-training'
  | 'evaluation-validation'
  | 'privacy-analysis'
  | 'generated-datasets'
  | 'reports'
  | 'settings';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  badge?: string;
  category: 'core' | 'ai-pipeline' | 'governance';
}
