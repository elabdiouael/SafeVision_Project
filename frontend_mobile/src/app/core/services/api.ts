import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InterventionCreate, PredictionResult } from '../models/intervention';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  // تأكد أن الرابط هو هذا (ديال Python)
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * 1. PREDICT: Envoie les chiffres à l'IA
   */
  predict(data: InterventionCreate): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 2. HISTORY: Récupère l'historique
   */
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 3. OCR: Envoie l'image pour analyse (HADI HIYA LI KANT NAQSA)
   */
  scanIntervention(blob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', blob, 'scan.jpg');

    return this.http.post<any>(`${this.apiUrl}/ocr`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // --- ERROR HANDLER ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erreur inconnue!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur Client: ${error.error.message}`;
    } else {
      errorMessage = `Code Server: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('🔥 Erreur API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}