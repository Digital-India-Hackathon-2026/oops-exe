import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AIAvatar3D({ isActive, isSpeaking }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x87ceeb, 1, 100);
    pointLight.position.set(0, 3, 5);
    scene.add(pointLight);

    // Avatar Core (glowing sphere)
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      shininess: 90,
      specular: 0x111111,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 5000;
    const posArray = new Float32Array(particlesCnt * 3);
    for (let i = 0; i < particlesCnt * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.7,
    });
    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    let mouseX = 0, mouseY = 0;
    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) / 100;
      mouseY = (event.clientY - window.innerHeight / 2) / 100;
    };
    document.addEventListener('mousemove', onDocumentMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth camera movement towards mouse
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      particleMesh.rotation.y += 0.0005;
      sphere.rotation.y += 0.002;

      // Speaking animation
      if (isSpeaking) {
        sphere.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.05);
        pointLight.intensity = 1.5 + Math.sin(Date.now() * 0.02);
      } else {
        sphere.scale.setScalar(1);
        pointLight.intensity = 1;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
        if(containerRef.current) {
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isSpeaking]);

  return <div ref={containerRef} className="w-full h-full" />;
}