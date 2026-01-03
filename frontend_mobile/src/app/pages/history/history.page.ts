import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { ApiService } from 'src/app/core/services/api';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html', // Kaychiir l fichier li lfouq
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NavbarComponent]
})
export class HistoryPage implements OnInit {
  
  history: any[] = [];
  loading: boolean = false;
  // Verify port (8000 wla 5000)
  private baseUrl = 'http://127.0.0.1:8000'; 

  constructor(private apiService: ApiService) { }

  ngOnInit() { this.loadHistory(); }
  
  refreshHistory() { this.loadHistory(); }

  loadHistory() {
    this.loading = true;
    this.apiService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
        console.log("Data reçue:", data); // Check Console
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // Fonction 1: Voir Photo
  openImage(imageId: string) {
    if (!imageId || imageId === 'N/A') return;
    window.open(`${this.baseUrl}/uploads/${imageId}`, '_blank');
  }

  // Fonction 2: PDF Download
  downloadPDF(imageId: string) {
    if (!imageId || imageId === 'N/A') return;
    const pdfUrl = `${this.baseUrl}/api/report/${imageId}`;
    window.open(pdfUrl, '_blank');
  }
}