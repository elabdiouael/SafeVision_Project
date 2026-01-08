import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private explodeSubject = new BehaviorSubject<{active: boolean, type: string}>({active: false, type: ''});
  explode$ = this.explodeSubject.asObservable();

  // 👇 FIX: Rddinaha 'string' bach t-9bel 'matrix-rain' w ay haja khra
  triggerExplosion(effectType: string) {
    this.explodeSubject.next({ active: true, type: effectType }); 
    
    setTimeout(() => {
      this.explodeSubject.next({ active: false, type: '' });
    }, 800);
  }
}