import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { addIcons } from 'ionicons';
import { arrowDownOutline, nuclearOutline, bugOutline, skullOutline, banOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NavbarComponent],
})
export class HomePage implements OnInit {
  
  totalHeight = 0;
  translateX = 0;
  triggerExplosion = false;
  hasExploded = false;

  constructor() {
    // Icons jdad dyal l-Home
    addIcons({ arrowDownOutline, nuclearOutline, bugOutline, skullOutline, banOutline });
  }

  ngOnInit() {
    this.totalHeight = window.innerHeight * 3; // 300vh scroll space
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Calcul
    const maxScroll = this.totalHeight - windowHeight;
    let percentage = scrollTop / maxScroll;
    if (percentage < 0) percentage = 0;
    if (percentage > 1) percentage = 1;

    // Movement Horizontal
    this.translateX = -(percentage * windowWidth);

    // Trigger Transition (45%)
    if (percentage > 0.45 && !this.hasExploded) {
      this.lancerExplosion();
    }
  }

  lancerExplosion() {
    this.hasExploded = true;
    this.triggerExplosion = true;
    
    setTimeout(() => {
      this.triggerExplosion = false;
    }, 500);
  }
}