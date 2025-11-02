import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { MatTabsModule } from '@angular/material/tabs'
import { MatMenuModule } from '@angular/material/menu'
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { saveAs } from 'file-saver';

import { ImportDialog } from '../import-dialog/import-dialog';
import { ShareDialog } from '../share-dialog/share-dialog';
import { Puzzle, PuzzleStatus, PuzzleStorage, MAXSTARS } from '../../shared/puzzle';
import { GzipBase64Compressor } from '../../shared/gzip-base64-compressor';
import { base64UrlToBase64 } from '../../shared/base64Util';
import { GameService } from '../../shared/game-service';

@Component({
  selector: 'app-puzzle-list',
  imports: [MatButtonModule, MatIconModule, MatTabsModule, MatMenuModule, MatDividerModule, CommonModule],
  templateUrl: './puzzle-list.html',
  styleUrl: './puzzle-list.scss'
})
export class PuzzleList implements OnInit, AfterViewInit {

  public readonly PuzzleStatus = PuzzleStatus;
  public readonly MAXSTARS = MAXSTARS;
  public selected: Map<number, boolean>;
  public addDataMessage?: string;
  public fragment: string = "p";
  public selectedTab: number = 0;
  public addedPuzzleHashes: string[] = [];

  public playEditing: boolean = false;
  public playSelected: Set<string>;

  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog)
  {
    this.selected = new Map<number, boolean>();
    this.playSelected = new Set<string>;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {

      const data = params.get('gamedata');
      this.addedPuzzleHashes = [];
      this.addDataMessage = undefined;
      if (data)
      {
        GzipBase64Compressor.decompressObject<PuzzleStorage[]>(base64UrlToBase64(data)).then((puzzles) => {

          let i=0;
          for (const puzzle of puzzles)
          {
            const addedRound = this.gameService.addRound(puzzle);
            if (addedRound)
            {
              i += 1;
              this.addedPuzzleHashes.push(addedRound.hash)
            }
          }

          if (i > 0 && i < 2)
          {
            this.addDataMessage = `Loaded ${i} new puzzle!`;
          }
          else if (i >= 2)
          {
            this.addDataMessage = `Loaded ${i} new puzzles!`;
          }
        });
      }
    });

    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment ?? "p";
      if (this.fragment.startsWith('p'))
      {
        // Select play tab
        this.selectedTab = 0;
      }
      else if (this.fragment.startsWith('m'))
      {
        // Select make tab
        this.selectedTab = 1;
      }
    });
  }

  ngAfterViewInit(): void {
    document?.querySelector('#' + this.fragment)?.scrollIntoView();
  }

  public get puzzles(): Puzzle[]
  {
    return this.gameService.puzzles;
  }

  public get nonCompletedPuzzles(): Puzzle[]
  {
    return this.gameService.puzzles.filter((p)=>(p.status != PuzzleStatus.Complete));
  }

  public get completedPuzzles(): Puzzle[]
  {
    return this.gameService.puzzles.filter((p)=>(p.status == PuzzleStatus.Complete));
  }

  public get madePuzzles(): PuzzleStorage[]
  {
    return this.gameService.madePuzzles;
  }

  public playPuzzle(round: Puzzle)
  {
    this.router.navigate([`/play/${round.hash}`]);
  }

  public makePuzzle()
  {
    this.router.navigate([`/make`]);
  }

  public editPuzzle(puzzleId: number)
  {
    this.router.navigate([`/make/${puzzleId}`]);
  }

  public deleteMadePuzzle(puzzleId: number)
  {
    this.gameService.deleteMadePuzzle(puzzleId);

    // Adjust the selected map
    const selected = new Map<number, boolean>();
    for (const [ind, sel] of this.selected)
    {
      if (ind > puzzleId)
      {
        selected.set(ind-1, sel);
      }
      else if (ind < puzzleId)
      {
        selected.set(ind, sel);
      }
    }
    this.selected = selected;
  }

  public getIndicatorIcon(puzzle: Puzzle): string
  {
    if (puzzle.status == PuzzleStatus.Complete && puzzle.win)
      return "check_circle";
    if (puzzle.status == PuzzleStatus.Complete && !puzzle.win)
      return "heart_broken";
    if (puzzle.status == PuzzleStatus.Started)
      return "sync"
    return ""
  }

  public getPlayString(puzzle: Puzzle): string
  {
    if (puzzle.status == PuzzleStatus.Complete)
      return "View Results";
    if (puzzle.status == PuzzleStatus.Started)
      return "Resume Playing"
    return "Play"
  }

  public deselectAll(): void
  {
    this.selected.clear();
  }

  public selectAll(): void
  {
    this.selected.clear();
    for (let i=0; i < this.gameService.madePuzzles.length; ++i)
    {
      this.selected.set(i, true);
    }
  }

  public isSelected(index: number): boolean
  {
    return this.selected.get(index) ?? false;
  }

  public toggleSelect(index: number): void
  {
    this.selected.set(index, !(this.selected.get(index)??false));
  }

  public getSelected(): PuzzleStorage[]
  {
    return this.gameService.madePuzzles.filter((_, index)=>this.isSelected(index));
  }

  public playtest(id: number)
  {
    this.router.navigate([`/playtest/${id}`]);
  }

  public shareSelected()
  {
    let dialogRef = this.dialog.open(ShareDialog, {
      data: { puzzles: this.getSelected() }
    });
  }

  public starRatingWidthStyle(puzzle: Puzzle)
  {
    return `width: ${puzzle.starScore * 2.0}rem`;
  }

  public exportSelectedPuzzles()
  {
    const selectedPuzzles = this.getSelected();
    if (selectedPuzzles.length > 0)
    {
      var file = new File([JSON.stringify(selectedPuzzles, null, 2)], "puzzle-export.json", {type: "text/json;charset=utf-8"});
      saveAs(file);
    }
  }

  public deleteSelected(): void
  {
    // Get indicies to delete
    const puzzlesToDelete: number[] = [];
    for (const [ind, sel] of this.selected)
    {
      if (sel)
      {
        puzzlesToDelete.push(ind);
      }
    }
    
    // Do a reverse sort and delete from the bottom up
    puzzlesToDelete.sort((a,b)=>b-a);
    for (const i of puzzlesToDelete)
    {
      this.gameService.deleteMadePuzzle(i);
    }

    // Clear all selected
    this.selected = new Map<number, boolean>();
  }

  public showImportDialog(): void
  {
    this.dialog.open(ImportDialog, {data: this.gameService });
  }

  public toggleEditPlay(): void
  {
    this.playEditing = !this.playEditing;
  }

  public togglePlaySelect(puzzleHash: string): void
  {
    if (this.playEditing)
    {
      if (this.playSelected.has(puzzleHash))
      {
        this.playSelected.delete(puzzleHash);
      }
      else
      {
        this.playSelected.add(puzzleHash);
      }
    }
  }

  public removeSelectedPlayPuzzles(): void
  {
    this.gameService.removePlayPuzzles(this.playSelected);
    this.playSelected.clear();
    this.playEditing = false;
  }

  public selectPlayCompleted(): void
  {
    for (const puzzle of this.completedPuzzles)
    {
      this.playSelected.add(puzzle.hash);
    }
  }
  
  public selectPlayAll(): void
  {
    for (const puzzle of this.puzzles)
    {
      this.playSelected.add(puzzle.hash);
    }
  }

  public deselectPlayAll(): void
  {
    this.playSelected.clear();
  }
}
