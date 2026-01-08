import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { TransitionService } from 'src/app/core/services/transition.service';
import { addIcons } from 'ionicons';
import { homeOutline, scanOutline, terminalOutline, analyticsOutline, powerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class NavbarComponent implements OnInit {

  // Variable bach n-stockiw wach admin
  isUserAdmin = false;

  constructor(
    private authService: AuthService,
    private transitionService: TransitionService,
    private router: Router
  ) { 
    addIcons({ homeOutline, scanOutline, terminalOutline, analyticsOutline, powerOutline });
  }

  ngOnInit() {
    // Check role mli t-chargé navbar
    this.isUserAdmin = this.authService.isAdmin();
  }

  navigateWithBoom(path: string) {
    // ... (Code navigation kifma kan) ...
    let effect: 'white-glitch' | 'holo-warp' | 'matrix-rain' = 'white-glitch'; // Note: Smmiyna wahd jdid matrix-rain

    if (path === '/home') effect = 'white-glitch';
    if (path === '/scan') effect = 'holo-warp';
    if (path === '/history') effect = 'matrix-rain'; // 👇 JDID
    if (path === '/dashboard') effect = 'white-glitch';

    this.transitionService.triggerExplosion(effect);
    
    setTimeout(() => {
      this.router.navigate([path]);
    }, 400);
  }

  logout() {
    this.authService.logout();
  }
}