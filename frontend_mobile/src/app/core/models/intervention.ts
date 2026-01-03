export interface InterventionCreate {
    cable_metres: number;
    temps_heures: number;
  }
  
  export interface PredictionResult {
    status: 'NORMAL' | 'ANOMALY';
    risk_score: number;
    message: string;
  }