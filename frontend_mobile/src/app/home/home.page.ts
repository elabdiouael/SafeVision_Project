import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { ApiService } from '../core/services/api';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, NavbarComponent, RouterModule],
})
export class HomePage {
  
  // Stats Variables (Real-time)
  totalInterventions: number = 0;
  anomaliesCount: number = 0;
  validatedCount: number = 0;
  
  constructor(private apiService: ApiService) {}

  // Kulla merra katchouf l-Home, kay-3awed y-7sseb
  ionViewWillEnter() {
    this.calculateStats();
  }

  calculateStats() {
    this.apiService.getHistory().subscribe({
      next: (data) => {
        this.totalInterventions = data.length;
        
        // Filter & Count (Big Data Logic sghir)
        this.anomaliesCount = data.filter(item => item.Status === 'ANOMALY').length;
        this.validatedCount = data.filter(item => item.Status === 'NORMAL').length;
      },
      error: (err) => {
        console.error("Ma9dernach njibo stats", err);
      }
    });
  }
}