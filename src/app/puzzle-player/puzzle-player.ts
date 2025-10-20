import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';

import { Word, GroupValue, Puzzle, PuzzleStatus, GROUPSIZE } from '../../shared/puzzle';
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
  private subscription?: Subscription;
  public wrongAnim: boolean = false;
  
  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router)
  {
  }

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {

      const hash = params.get('hash');
      const id = params.get('id');

      if (hash)
      {
        this.puzzle = this.gameService.getRound(params.get('hash') ?? "");
        this.isPlaytest = false;
      }
      else if (id)
      {
        this.puzzle = new Puzzle(this.gameService.getMadePuzzleCopy(Number.parseInt(id)));
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
        this.wrongAnim = true;
        setTimeout(()=>{
          this.wrongAnim = false;
        }, 500);
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
}
