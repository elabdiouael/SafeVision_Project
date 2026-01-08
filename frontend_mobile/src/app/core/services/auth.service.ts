import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ⚠️ VERIFIER IP ILA TESTITI F REAL DEVICE
  private apiUrl = 'http://127.0.0.1:8000/api'; 
  private tokenKey = 'auth_token';
  private roleKey = 'user_role'; // <--- ZIDNA HADI
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(username: string, password: string): Observable<any> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<any>(`${this.apiUrl}/login`, formData).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.access_token);
        // 👇 SAUVEGARDE DU ROLE
        if (response.role) {
            localStorage.setItem(this.roleKey, response.role);
        }
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey); // <--- NETTOYAGE
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 👇 HADI HIYA LI KANT NAQSAK (THE MISSING FUNCTION)
  isAdmin(): boolean {
    return localStorage.getItem(this.roleKey) === 'admin';
  }
}