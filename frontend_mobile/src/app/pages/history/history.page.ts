import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { ApiService } from 'src/app/core/services/api';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NavbarComponent]
})
export class HistoryPage {
  
  interventions: any[] = [];
  loading: boolean = true;
  errorMsg: string = '';

  constructor(private apiService: ApiService) { }

  // Hada kay-t'lanca kulla merra kat-dkhol l-page
  ionViewWillEnter() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.apiService.getHistory().subscribe({
      next: (data) => {
        this.interventions = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = "Impossible de charger l'historique.";
        this.loading = false;
      }
    });
  }

  // Helper bach n-lowno l-Status
  getStatusColor(status: string): string {
    return status === 'NORMAL' ? 'success' : 'danger';
  }
}