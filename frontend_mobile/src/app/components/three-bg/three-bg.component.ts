import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core'; // Zid AfterViewInit
import * as THREE from 'three';

@Component({
  selector: 'app-three-bg',
  templateUrl: './three-bg.component.html',
  styleUrls: ['./three-bg.component.scss'],
  standalone: true
})
export class ThreeBgComponent implements AfterViewInit, OnDestroy { // Implement AfterViewInit
  
  // ... variables ...
  private container: HTMLElement | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private frameId: number = 0;

  constructor(private el: ElementRef) {}

  // 👇 HNA L-TAGHYIR: Move init mn ngOnInit l ngAfterViewInit
  ngAfterViewInit() {
    this.container = this.el.nativeElement.querySelector('#canvas-container');
    if(this.container) {
      this.initThree();
      this.animate();
      window.addEventListener('resize', this.onWindowResize.bind(this));
    } else {
        console.error("❌ Canvas Container mal9inahch!");
    }
  }
  
  ngOnDestroy() {
    // ... (meme code) ...
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    if (this.renderer) this.renderer.dispose();
  }

  initThree() {
    // ... (meme code initThree li 3titk 9bila) ...
    // ... just ensure material color is bright enough ...
    // const material = new THREE.PointsMaterial({ color: 0x00f3ff, size: 3 ... });
    
    // ⚠️ RE-COPIER L-CODE D INIT ILA KAN KHAWI
    if (!this.container) return;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x00f3ff, 0.002);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    this.camera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 1000; i++) {
      vertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0x00f3ff, size: 3, transparent: true, opacity: 0.8 });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  animate() {
    this.frameId = requestAnimationFrame(this.animate.bind(this));
    if(this.particles) {
        this.particles.rotation.x += 0.0005;
        this.particles.rotation.y += 0.001;
    }
    if(this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    // ... (meme code) ...
     if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}