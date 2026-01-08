import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/core/services/api';
import { Chart, registerables } from 'chart.js';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { layersOutline, alertCircleOutline, shieldCheckmarkOutline, resizeOutline, pieChartOutline } from 'ionicons/icons';
// 👇 1. IMPORT NAVBAR COMPONENT
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  // 👇 2. AJOUTER NAVBAR ICI
  imports: [IonicModule, CommonModule, RouterModule, NavbarComponent]
})
export class DashboardPage implements OnInit {
  
  stats = {
    total_interventions: 0,
    anomalies_count: 0,
    success_rate: 0,
    total_cable_km: 0
  };
  chart: any;

  constructor(private apiService: ApiService) { 
    addIcons({ layersOutline, alertCircleOutline, shieldCheckmarkOutline, resizeOutline, pieChartOutline });
  }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.apiService.getHistory().subscribe(data => {
        const total = data.length;
        const anomalies = data.filter((x:any) => x.Status === 'ANOMALY').length;
        const valid = total - anomalies;
        
        this.stats = {
            total_interventions: total,
            anomalies_count: anomalies,
            success_rate: total > 0 ? Math.round((valid / total) * 100) : 0,
            total_cable_km: parseFloat((data.reduce((acc:any, curr:any) => acc + (parseFloat(curr.Cable_m) || 0), 0) / 1000).toFixed(2))
        };

        if (this.chart) this.chart.destroy(); 
        this.initChart(valid, anomalies);
    });
  }

  initChart(valid: number, anomalies: number) {
    const canvas = document.getElementById('riskChart') as HTMLCanvasElement;
    if(!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['SECURE', 'THREATS'],
        datasets: [{
          data: [valid, anomalies],
          backgroundColor: ['#00ff41', '#ff2a2a'],
          borderColor: '#050505',
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff',
              font: { family: 'Orbitron', size: 12 },
              usePointStyle: true,
              padding: 20
            }
          }
        },
        elements: {
            arc: {
               // 👇 3. FIX: MS7NA SHADOWCOLOR HIT MACHI OFFICIEL
               borderWidth: 2
            }
        }
      }
    });
  }
}