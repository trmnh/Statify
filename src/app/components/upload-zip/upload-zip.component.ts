import { Component, EventEmitter, Output, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-upload-zip',
  standalone: true,
  templateUrl: './upload-zip.component.html',
  styleUrls: ['./upload-zip.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class UploadZipComponent {
  @Output() dataLoaded = new EventEmitter<File>();
  @Output() error = new EventEmitter<string>();

  isDragOver = false;
  isProcessing = false;
  selectedFile: File | null = null;
  uploadStatus: 'idle' | 'processing' | 'success' | 'error' = 'idle';
  errorMessage = '';

  constructor() {
    addIcons({
      cloudUploadOutline,
      documentOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      closeOutline,
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File) {
    // Vérifier que c'est un fichier ZIP
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.showError('Veuillez sélectionner un fichier ZIP valide');
      return;
    }

    // Vérifier la taille du fichier (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      this.showError('Le fichier est trop volumineux (max 100MB)');
      return;
    }

    this.selectedFile = file;
    this.uploadStatus = 'processing';
    this.isProcessing = true;
    this.errorMessage = '';

    // Simuler un délai de traitement
    setTimeout(() => {
      this.uploadStatus = 'success';
      this.isProcessing = false;
      this.dataLoaded.emit(file);
    }, 1000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.uploadStatus = 'error';
    this.isProcessing = false;
    this.error.emit(message);
  }

  resetUpload() {
    this.selectedFile = null;
    this.uploadStatus = 'idle';
    this.isProcessing = false;
    this.errorMessage = '';
  }

  selectFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFile(target.files[0]);
      }
    };
    input.click();
  }
}
