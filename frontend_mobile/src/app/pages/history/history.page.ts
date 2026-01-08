import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/core/services/api';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { addIcons } from 'ionicons';
import { serverOutline, searchOutline, folderOpenOutline, resizeOutline, timeOutline, alertCircleOutline, shieldCheckmarkOutline, eyeOutline, downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, NavbarComponent]
})
export class HistoryPage implements OnInit {

  history: any[] = [];
  loading = true;

  constructor(private apiService: ApiService) {
    addIcons({ 
      serverOutline, searchOutline, folderOpenOutline, 
      resizeOutline, timeOutline, alertCircleOutline, 
      shieldCheckmarkOutline, eyeOutline, downloadOutline 
    });
  }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.apiService.getHistory().subscribe({
      next: (data) => {
        // Simulation delay for "Decrypting" effect
        setTimeout(() => {
          this.history = data;
          this.loading = false;
        }, 1000);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openImage(imageId: string) {
    if (!imageId || imageId === 'N/A') return;
    const imageUrl = this.apiService.getImageUrl(imageId);
    window.open(imageUrl, '_blank');
  }

  downloadPDF(imageId: string) {
    if (!imageId || imageId === 'N/A') return;
    // Logic download PDF
    console.log("Downloading PDF for:", imageId);
  }
}