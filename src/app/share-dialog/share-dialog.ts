import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';

import { PuzzleStorage } from '../../shared/puzzle';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { base64ToBase64Url } from '../../shared/base64Util';
import { GzipBase64Compressor } from '../../shared/gzip-base64-compressor';
import { toCanvas as qrToCanvas } from 'qrcode'



export interface ShareDialogData {
  puzzles: PuzzleStorage[]
}

@Component({
  selector: 'app-share-dialog',
  imports: [ ClipboardModule, MatButtonModule ],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss'
})

export class ShareDialog implements AfterViewInit {

  // its important myCanvas matches the variable name in the template
  @ViewChild('qrCodeCanvas', {static: false})
  canvas: ElementRef<HTMLCanvasElement> | null = null;
  context: CanvasRenderingContext2D | null | undefined = null;

  generatingQrCode: boolean = true;
  failedToGenerateQrCode: boolean = false;

  public shareLink: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ShareDialogData)
  {
    this.shareLink = "http://bubbulon.com/cm/";
  }

  ngAfterViewInit(): void {
    this.context = this.canvas?.nativeElement.getContext('2d');

    GzipBase64Compressor.compressObject(this.data.puzzles).then((compressedValue) => {
    
      this.shareLink = `http://bubbulon.com/cm/add/${base64ToBase64Url(compressedValue)}`;

      if (this.canvas)
      {
        qrToCanvas(this.canvas.nativeElement, this.shareLink).then(()=>{
          this.generatingQrCode = false;
          this.canvas!.nativeElement.style = "";
        },(_)=>{
          this.generatingQrCode = false;
          this.failedToGenerateQrCode = true;
        });
      }
    });
  }
}
