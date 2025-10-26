import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { MatTabsModule } from '@angular/material/tabs'
import { MatMenuModule } from '@angular/material/menu'
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ShareDialog } from '../share-dialog/share-dialog';
import { Puzzle, PuzzleStatus, PuzzleStorage, MAXSTARS } from '../../shared/puzzle';
import { GzipBase64Compressor } from '../../shared/gzip-base64-compressor';
import { base64UrlToBase64 } from '../../shared/base64url';
import { GameService } from '../../shared/game-service';


@Component({
  selector: 'app-puzzle-list',
  imports: [MatButtonModule, MatIconModule, MatTabsModule, MatMenuModule, MatDividerModule],
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

  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog)
  {
    this.selected = new Map<number, boolean>();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {

      const data = params.get('gamedata');

      if (data)
      {
        GzipBase64Compressor.decompressObject<PuzzleStorage[]>(base64UrlToBase64(data)).then((puzzles) => {

          let i=0;
          for (const puzzle of puzzles)
          {
            if (this.gameService.addRound(puzzle))
            {
              i += 1;
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

  public deletePuzzle(puzzleId: number)
  {
    this.gameService.deletePuzzle(puzzleId);

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
      return "check_circle_outline";
    if (puzzle.status == PuzzleStatus.Started)
      return "sync"
    return ""
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

}
