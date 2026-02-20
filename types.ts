
export enum ProjectPhase {
  CORE = 'Core Implementation',
  ADVANCED = 'Advanced Logic',
  LATER = 'Future Polish',
  // Added missing phases required by ProjectOverview component
  NEW_WORK = 'New Implementation',
  EXISTING = 'Existing Endpoint'
}

// Added EndpointMethod enum required by ProjectOverview component
export enum EndpointMethod {
  GET = 'GET',
  POST = 'POST'
}

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  payload?: string;
}

// Added EndpointDef interface required by ProjectOverview component
export interface EndpointDef {
  path: string;
  method: EndpointMethod;
  description: string;
  phase: ProjectPhase;
  inputs: string[];
  outputs: string[];
}

// Added Requirement interface required by ProjectOverview component
export interface Requirement {
  category: string;
  items: string[];
}

// Added AgentWorkflowStep interface required by ProjectOverview component
export interface AgentWorkflowStep {
  step: number;
  action: string;
  details: string;
}

export interface HubtigerJob {
  id: number;
  jobCardNo: string;
  customerName: string;
  bike: string;
  status: string;
  technician?: string;
  estimatedReady?: string;
  totalCost?: number;
  mechanicNotes?: string;
}
