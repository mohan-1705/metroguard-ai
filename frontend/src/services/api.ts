import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SensorReading {
  id: number;
  train_id: string;
  line: string;
  station: string;
  speed: number;
  vibration: number;
  axle_temperature: number;
  brake_temperature: number;
  track_temperature: number;
  status: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  train_id: string;
  line: string;
  station: string;
  detected_issue: string;
  severity: string;
  status: string;
  created_at: string;
  ai_confidence?: number;
  ai_summary?: string;
  recommendation?: string;
}

export interface WorkOrder {
  id: string;
  incident_id: string;
  task: string;
  priority: string;
  technician_id?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  technician?: {
    id: string;
    name: string;
    specialty: string;
    status: string;
  };
}

export interface Approval {
  id: number;
  incident_id: string;
  reviewer: string;
  decision: string;
  comment?: string;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  incident_id?: string;
  user: string;
  timestamp: string;
  metadata?: any;
}

export const api = {
  getHealth: () => client.get("/api/health"),
  getDashboard: () => client.get("/api/dashboard"),
  getSensors: () => client.get<SensorReading[]>("/api/sensors"),
  getSensorHistory: (trainId: string) => client.get<SensorReading[]>(`/api/sensors/${trainId}`),
  postSensorEvent: (data: any) => client.post("/api/sensors/events", data),
  getIncidents: () => client.get<Incident[]>("/api/incidents"),
  getIncidentDetails: (id: string) => client.get<Incident>(`/api/incidents/${id}`),
  analyzeIncident: (id: string) => client.post(`/api/incidents/${id}/analyze`),
  approveIncident: (id: string, comment: string) => client.post(`/api/incidents/${id}/approve`, { comment }),
  rejectIncident: (id: string, comment: string) => client.post(`/api/incidents/${id}/reject`, { comment }),
  getWorkOrders: () => client.get<WorkOrder[]>("/api/work-orders"),
  getWorkOrderDetails: (id: string) => client.get<WorkOrder>(`/api/work-orders/${id}`),
  updateWorkOrder: (id: string, status?: string, technician_id?: string) =>
    client.put<WorkOrder>(`/api/work-orders/${id}`, { status, technician_id }),
  getKnowledgeDocuments: () => client.get("/api/knowledge/documents"),
  searchKnowledge: (q: string) => client.get(`/api/knowledge/search?q=${q}`),
  ingestKnowledge: () => client.post("/api/knowledge/ingest"),
  getApprovals: () => client.get<Approval[]>("/api/approvals"),
  getAuditLogs: () => client.get<AuditLog[]>("/api/audit-logs"),
  getAnalytics: () => client.get("/api/analytics"),
};
