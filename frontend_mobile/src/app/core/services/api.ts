import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InterventionCreate, PredictionResult } from '../models/intervention';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  // URL d Server Python (Localhost)
  // Mola7ada: Ila kheddam b Android Emulator, dir 'http://10.0.2.2:8000/api'
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * Envoie les données à l'IA pour analyse
   * Method: POST
   */
  predict(data: InterventionCreate): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, data)
      .pipe(
        catchError(this.handleError) // Gestion d'erreur automatique
      );
  }

  /**
   * Récupère l'historique des interventions depuis le CSV backend
   * Method: GET
   */
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // --- PRIVATE HELPERS ---

  // Fonction privée pour gérer les erreurs proprement
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erreur inconnue!';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur Client (Ex: Pas d'internet)
      errorMessage = `Erreur Client: ${error.error.message}`;
    } else {
      // Erreur Server (Ex: Python ta7, 404, 500)
      // Hna fin kan-3rfou ila Python t-planta
      errorMessage = `Code Server: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('🔥 Erreur API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}