import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InterventionCreate, PredictionResult } from '../models/intervention';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Helper bach nziido Header
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  predict(data: InterventionCreate): Observable<PredictionResult> {
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  scanIntervention(blob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', blob, 'scan.jpg');
    // Note: M3a FormData, matdirch Content-Type header, Browser kaydiro rasso
    return this.http.post<any>(`${this.apiUrl}/ocr`, formData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

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