import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';

import { Word, GroupValue, Puzzle, PuzzleStatus, GROUPSIZE, NUMGROUPS } from '../../shared/puzzle';
import { GameService } from '../../shared/game-service';


@Component({
  selector: 'app-puzzle-player',
  imports: [ CommonModule, MatButtonModule, MatIconModule ],
  templateUrl: './puzzle-player.html',
  styleUrl: './puzzle-player.scss'
})
export class PuzzlePlayer implements OnInit {

  public readonly GroupValue = GroupValue;
  public readonly PuzzleStatus = PuzzleStatus;

  public puzzle?: Puzzle;
  private isPlaytest: boolean = false;
  public wrongAnim: boolean = false;
  public oneAwayAnim: boolean = false;
  public puzzleHash: string = "";
  public madePuzzleId: number = -1;
  
  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router)
  {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {

      this.puzzleHash = params.get('hash') ?? "";
      this.madePuzzleId = Number.parseInt(params.get('id') ?? "-1");

      if (this.puzzleHash.length > 0)
      {
        this.puzzle = this.gameService.getRound(this.puzzleHash);
        this.isPlaytest = false;
      }
      else if (this.madePuzzleId != -1)
      {
        this.puzzle = new Puzzle(this.gameService.getMadePuzzleCopy(this.madePuzzleId));
        this.isPlaytest = true;
      }
    });
  }

  public onClick(word: Word)
  {
    if (this.puzzle!.status != PuzzleStatus.Complete && (this.puzzle!.selectedCount < GROUPSIZE || word.selected))
    {
      word.toggleSelected();
    }
  }

  public shuffle(): void
  {
    this.puzzle!.shuffle();
  }

  public deselectAll(): void
  {
    this.puzzle!.deselectAll();
  }

  public submit(): void
  {
    if (this.puzzle!.wrongGuessesRemaining > 0)
    {
      const guess = this.puzzle!.makeGuess(this.puzzle!.selected);
      if (guess && !guess.isCorrect)
      {
        let groupCounts = new Array<number>(NUMGROUPS);
        for (let i=0; i < NUMGROUPS; ++i)
        {
          groupCounts[i] = 0;
        }
        for (const word of guess.words)
        {
          groupCounts[word.groupId] += 1;
        }

        this.wrongAnim = true;
        this.oneAwayAnim = (Math.max(...groupCounts) == (GROUPSIZE-1));

        setTimeout(()=>{
          this.wrongAnim = false;
        }, 500);

        setTimeout(()=>{
          this.oneAwayAnim = false;
        }, 2000);
      }

      if (!this.isPlaytest)
      {
        this.gameService.updateSave(this.puzzle!);
      }
    }
  }

  public get starRatingWidthStyle(): string
  {
    return `width: ${this.puzzle!.starScore * 2.0}rem`;
  }

  public navigateToMenu(): void
  {
    if (this.isPlaytest)
    {
      this.router.navigate(["/"], {fragment: `m-${this.madePuzzleId}`});
    }
    else
    {
      this.router.navigate(["/"], {fragment: `p-${this.puzzleHash}`});
    }
  }
}
