import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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
  
  // Données manuelles (Inputs)
  data: InterventionCreate = {
    cable_metres: null as any,
    temps_heures: null as any
  };

  // États de l'interface
  resultMessage: string = '';
  resultStatus: 'NORMAL' | 'ANOMALY' | null = null;
  loading: boolean = false;
  
  // Image capturée (Pour l'OCR)
  capturedImage: string | undefined;

  constructor(private apiService: ApiService) {}

  /**
   * 1. ACTIVE LA CAMERA
   * Ouvre la caméra ou la galerie pour prendre une photo
   */
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt // Choix: Camera ou Galerie
      });

      if (image.base64String) {
        // On affiche l'image et on reset les résultats précédents
        this.capturedImage = 'data:image/jpeg;base64,' + image.base64String;
        this.resultMessage = ''; 
        this.resultStatus = null;
      }
    } catch (error) {
      console.log('Camera annulée ou erreur:', error);
    }
  }

  /**
   * 2. LE CERVEAU DE LA PAGE
   * Décide si on analyse une Image (OCR) ou des Chiffres (Manuel)
   */
  lancerAnalyse() {
    // Cas A: Une image est présente -> On lance l'OCR (Future étape)
    if (this.capturedImage) {
      this.analyserAvecOCR();
      return;
    }

    // Cas B: Pas d'image -> On vérifie les champs manuels
    if (!this.data.cable_metres || !this.data.temps_heures) {
      alert("⚠️ Saisissez les données OU scannez un rapport !");
      return;
    }

    // Cas C: Données manuelles valides -> Analyse Classique
    this.lancerRiskAnalysis();
  }

  /**
   * LOGIQUE A: ANALYSE PAR IMAGE (OCR)
   * (Pour l'instant, on affiche un message en attendant que Tesseract soit prêt)
   */
  analyserAvecOCR() {
    // C'est ici qu'on va appeler le nouvel endpoint Python /api/ocr
    alert("⏳ OCR en cours d'intégration... (Attente installation Tesseract)");
    
    // Code futur:
    // this.loading = true;
    // this.apiService.ocr(this.capturedImage).subscribe(...)
  }

  /**
   * LOGIQUE B: ANALYSE MANUELLE (EXISTANTE)
   * Envoie les chiffres directement à l'IA
   */
  lancerRiskAnalysis() {
    this.loading = true;
    this.resultMessage = '';
    this.resultStatus = null;

    this.apiService.predict(this.data).subscribe({
      next: (response) => {
        this.loading = false;
        this.resultStatus = response.status;
        this.resultMessage = response.message;
      },
      error: (err) => {
        this.loading = false;
        alert("❌ Erreur Server! Vérifiez que Python tourne.");
        console.error(err);
      }
    });
  }

  /**
   * UTILITY: Supprimer l'image pour revenir au mode manuel
   */
  resetImage() {
    this.capturedImage = undefined;
  }
}