import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { PuzzleStorage } from '../../shared/puzzle';
import { GameService, MergeStrategy } from '../../shared/game-service';

export interface ShareDialogData {
  puzzles: PuzzleStorage[]
}

@Component({
  selector: 'app-import-dialog',
  imports: [ MatButtonModule, MatFormFieldModule, MatSelectModule ],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.scss'
})

export class ImportDialog {

  public MergeStrategy = MergeStrategy;
  public selectedMergeStrategy: MergeStrategy = MergeStrategy.Duplicate;
  public fileList: FileList | null = null;
  public busy: boolean = false;
  private filesToImport: number = 0;

  constructor(private dialogRef: MatDialogRef<ImportDialog>, @Inject(MAT_DIALOG_DATA) private gameService: GameService)
  {
    
  }

  public onFilesSelected(files: FileList | null): void
  {
    this.fileList = files;
  }

  public import(): void
  {
    if (this.fileList && !this.busy)
    {
      this.busy = true;
      this.filesToImport = this.fileList.length;

      for (const file of this.fileList)
      {
          file.text().then((puzzleJson: string)=>{
            // On file read
            this.gameService.importMadePuzzles(puzzleJson, this.selectedMergeStrategy);
            this.filesToImport-=1;
            if (this.filesToImport <= 0)
            {
              this.dialogRef.close();
            }
          }, (_)=>{
            // On error
              this.filesToImport-=1;
              if (this.filesToImport <= 0)
              {
                this.dialogRef.close();
              }
          });
      }
    }
  }
}
