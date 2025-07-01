import axios from 'axios';
import type { PrefillSource } from '../types/prefill'

// API base URL - pointing to your Backendserver
const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for the API response
export interface GraphNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    id: string;
    component_key: string;
    component_type: string;
    component_id: string;
    name: string;
    prerequisites: string[];
    permitted_roles: string[];
    input_mapping: Record<string, any>;
    sla_duration: {
      number: number;
      unit: string;
    };
    approval_required: boolean;
    approval_roles: string[];
  };
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  $schema: string;
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  category: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  forms: any[];
  branches: any[];
  triggers: any[];
}

// API service functions
export const apiService = {
  // Fetch the action blueprint graph
  async getActionBlueprintGraph(tenantId: string, blueprintId: string): Promise<GraphData> {
    try {
      const response = await apiClient.get(`/api/v1/${tenantId}/actions/blueprints/${blueprintId}/graph`);
      return response.data;
    } catch (error) {
      console.error('Error fetching graph data:', error);
      throw error;
    }
  },

  // Get all forms from the graph data
  getFormsFromGraph(graphData: GraphData): GraphNode[] {
    return graphData.nodes.filter(node => node.type === 'form');
  },

  // Get form dependencies
  getFormDependencies(graphData: GraphData, formId: string): string[] {
    const form = graphData.nodes.find(node => node.id === formId);
    return form ? form.data.prerequisites : [];
  }
};

// Utility: Get fields for a given form node
export function getFieldsForFormNode(formNode: GraphNode, forms: any[]): { fieldName: string, fieldSchema: any }[] {
  const componentId = formNode.data.component_id;
  const formDef = forms.find(f => f.id === componentId);
  if (!formDef || !formDef.field_schema || !formDef.field_schema.properties) return [];
  return Object.entries(formDef.field_schema.properties).map(([fieldName, fieldSchema]) => ({
    fieldName,
    fieldSchema
  }));
}

// Utility: Get direct and transitive dependency fields as prefill sources
export function getPrefillSourcesForFormNode(
  formNode: GraphNode,
  allNodes: GraphNode[],
  forms: any[],
  edges: { source: string; target: string }[]
): PrefillSource[] {
  const visited = new Set<string>()
  const direct: string[] = formNode.data.prerequisites || []
  const transitive: Set<string> = new Set()

  // Helper: recursively collect transitive dependencies
  function collectTransitive(currentId: string) {
    if (visited.has(currentId)) return
    visited.add(currentId)
    const node = allNodes.find(n => n.id === currentId)
    if (node && node.data.prerequisites) {
      for (const dep of node.data.prerequisites) {
        if (!direct.includes(dep)) transitive.add(dep)
        collectTransitive(dep)
      }
    }
  }
  for (const dep of direct) {
    collectTransitive(dep)
  }

  // Helper: get fields for a node id
  function getFieldsForNodeId(nodeId: string, labelPrefix: string): PrefillSource[] {
    const node = allNodes.find(n => n.id === nodeId)
    if (!node) return []
    const componentId = node.data.component_id
    const formDef = forms.find(f => f.id === componentId)
    if (!formDef || !formDef.field_schema || !formDef.field_schema.properties) return []
    return Object.entries(formDef.field_schema.properties).map(([fieldName, fieldSchema]) => ({
      type: 'formField',
      formId: nodeId,
      fieldName,
      formName: `${labelPrefix} ${node.data.name}`.trim(),
    }))
  }

  // Gather sources
  let sources: PrefillSource[] = []
  for (const dep of direct) {
    sources = sources.concat(getFieldsForNodeId(dep, 'Direct:'))
  }
  for (const dep of Array.from(transitive)) {
    sources = sources.concat(getFieldsForNodeId(dep, 'Transitive:'))
  }

  // Add dummy global sources (can be extended)
  sources.push({ type: 'global', globalKey: 'dummy_global', label: 'Dummy Global Source' })

  return sources
}

export default apiService; 