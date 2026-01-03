export interface InterventionCreate {
  cable_metres: number;
  temps_heures: number;
  image_id?: string; // <-- ZID HADI (Optional)
}

export interface PredictionResult {
  status: 'NORMAL' | 'ANOMALY';
  risk_score: number;
  message: string;
}