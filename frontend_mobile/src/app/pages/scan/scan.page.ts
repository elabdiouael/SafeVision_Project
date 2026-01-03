import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { ApiService } from 'src/app/core/services/api';
import { InterventionCreate } from 'src/app/core/models/intervention';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, NavbarComponent]
})
export class ScanPage {
  
  data: InterventionCreate = {
    cable_metres: null as any,
    temps_heures: null as any,
    image_id: undefined // <-- Check 1: Hada darouri
  };

  resultMessage: string = '';
  resultStatus: 'NORMAL' | 'ANOMALY' | null = null;
  loading: boolean = false;
  capturedImage: string | undefined;

  constructor(
    private apiService: ApiService,
    private loadingCtrl: LoadingController
  ) {}

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (image.base64String) {
        this.capturedImage = 'data:image/jpeg;base64,' + image.base64String;
        this.resetUI();
        this.analyserAvecOCR();
      }
    } catch (error) {
      console.log('Camera annulée');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.capturedImage = reader.result as string;
        this.resetUI();
        this.analyserAvecOCR();
      };
      reader.readAsDataURL(file);
    }
  }

  resetUI() {
    this.resultMessage = ''; 
    this.resultStatus = null;
    this.data.image_id = undefined;
  }

  lancerAnalyse() {
    if (!this.data.cable_metres || !this.data.temps_heures) {
      alert("⚠️ Saisissez les données !");
      return;
    }
    // Hna fin kaymchi l ID l backend (m3a this.data)
    this.lancerRiskAnalysis();
  }

  // --- HADI HIYA L-PARTIE L-MOHIMA (OCR) ---
  async analyserAvecOCR() {
    if (!this.capturedImage) return;

    const loading = await this.loadingCtrl.create({
      message: 'Lecture intelligente (EasyOCR)...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const blob = this.base64ToBlob(this.capturedImage);

      this.apiService.scanIntervention(blob).subscribe({
        next: (response: any) => {
          loading.dismiss();
          
          if (response.status === 'success') {
            const result = response.data;
            
            // 👇👇👇👇 Check 2: Wach had Partie kayna? 👇👇👇👇
            if (response.image_id) {
                this.data.image_id = response.image_id;
                console.log("✅ Image ID Reçu & Stocké:", this.data.image_id);
            }
            // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

            let found = false;
            if (result.cable_metres) {
              this.data.cable_metres = result.cable_metres;
              found = true;
            }
            if (result.temps_heures) {
              this.data.temps_heures = result.temps_heures;
              found = true;
            }

            if (!found) {
                alert("⚠️ Aucun chiffre clair trouvé.");
            }
          }
        },
        error: (err: any) => {
          loading.dismiss();
          alert("❌ Erreur OCR Backend.");
          console.error(err);
        }
      });
    } catch (e) {
      loading.dismiss();
      console.error(e);
    }
  }

  lancerRiskAnalysis() {
    this.loading = true;
    this.resultMessage = '';
    this.resultStatus = null;

    this.apiService.predict(this.data).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.resultStatus = response.status;
        this.resultMessage = response.message;
      },
      error: (err: any) => {
        this.loading = false;
        alert("❌ Erreur Server AI.");
      }
    });
  }

  base64ToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) throw new Error('Invalid data URL');
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}