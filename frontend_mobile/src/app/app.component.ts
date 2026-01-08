import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TransitionService } from './core/services/transition.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule],
})
export class AppComponent {
  isExploding = false;
  effectType = '';

  constructor(private transitionService: TransitionService) {
    this.transitionService.explode$.subscribe(state => {
      this.isExploding = state.active;
      this.effectType = state.type;
    });
  }
}