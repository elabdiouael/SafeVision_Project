import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ApiService } from 'src/app/core/services/api';
import { addIcons } from 'ionicons';
import { apertureOutline, refreshOutline, scanCircleOutline, shieldCheckmarkOutline, warningOutline, wifiOutline } from 'ionicons/icons';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, NavbarComponent]
})
export class ScanPage {
  
  capturedImage: string | undefined;
  data = { cable_metres: null, temps_heures: null };
  loading = false;
  resultStatus: 'NORMAL' | 'ANOMALY' | null = null;
  resultMessage = '';

  constructor(private apiService: ApiService) {
    addIcons({ apertureOutline, refreshOutline, scanCircleOutline, shieldCheckmarkOutline, warningOutline, wifiOutline });
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera // Ola Prompt
      });
      this.capturedImage = image.dataUrl;
    } catch (error) {
      console.log('Camera cancelled');
    }
  }

  lancerAnalyse() {
    if (!this.capturedImage) return;
    
    this.loading = true;
    this.resultStatus = null;

    // Simulation d'analyse IA
    setTimeout(() => {
      this.loading = false;
      
      // Random Logic (Just for demo)
      const isAnomaly = Math.random() > 0.5;
      
      if (isAnomaly) {
        this.resultStatus = 'ANOMALY';
        this.resultMessage = 'Micro-fractures détectées dans la gaine principale. Risque de rupture à 85%.';
      } else {
        this.resultStatus = 'NORMAL';
        this.resultMessage = 'Intégrité structurelle confirmée. Aucune défaillance détectée.';
      }

      // Hna nrmlmnt kat-sifet l backend (apiService)
      // this.apiService.saveScan({...})
      
    }, 2000);
  }
}