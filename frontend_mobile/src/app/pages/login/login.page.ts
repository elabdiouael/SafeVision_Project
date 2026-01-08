import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { addIcons } from 'ionicons';
import { fingerPrintOutline, personCircleOutline, keyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {

  username = '';
  password = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    // Enregistrer les icônes pour qu'elles s'affichent
    addIcons({ fingerPrintOutline, personCircleOutline, keyOutline });
  }

  async login() {
    if (!this.username || !this.password) {
      this.presentToast('Veuillez entrer vos identifiants.', 'warning');
      return;
    }

    this.isLoading = true;

    // Simulation d'un petit délai pour voir l'effet "DÉCRYPTAGE..."
    // (Optional: t9der t7iyed setTimeout ila bghit vitesse max)
    setTimeout(() => {
      
      this.authService.login(this.username, this.password).subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            // Check Role : Admin يمشي Dashboard, User يمشي Home
            if (this.authService.isAdmin()) {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            this.presentToast('Accès Refusé: Identifiants invalides.', 'danger');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.presentToast('Erreur de connexion au serveur.', 'danger');
        }
      });

    }, 800); // 800ms delay pour l'effet "Hacker"
  }

  async presentToast(msg: string, color: 'danger' | 'warning' | 'success') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color: color,
      position: 'top',
      icon: color === 'danger' ? 'alert-circle-outline' : 'information-circle-outline',
      cssClass: 'cyber-toast' // N9dro n-styliw toast mn b3d
    });
    toast.present();
  }
}