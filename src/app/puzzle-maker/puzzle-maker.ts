import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'

import { GroupValue, GROUPSIZE, PuzzleStorage, checkPuzzleValidity, NUMGROUPS, idToDefaultName, PuzzleValidityResult } from '../../shared/puzzle';
import { GameService } from '../../shared/game-service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-puzzle-maker',
  imports: [FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './puzzle-maker.html',
  styleUrl: './puzzle-maker.scss'
})
export class PuzzleMaker implements OnInit {

  public readonly GroupValue = GroupValue;
  public readonly NUMGROUPS = NUMGROUPS;
  public readonly GROUPSIZE = GROUPSIZE;
  public readonly PuzzleValidityResult = PuzzleValidityResult;

  public puzzle: PuzzleStorage;
  public puzzleId: number;
  public validityStatus: PuzzleValidityResult;
  
  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router)
  {
    this.puzzle = {title: "", subtitle: "", groups: []};
    this.puzzleId = -1;
    this.validityStatus = PuzzleValidityResult.Valid;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.puzzleId = -1;
      const idStr = params.get('id');
      if (idStr)
      {
        this.puzzleId = Number.parseInt(idStr);
      }

      if (this.puzzleId >= 0)
      {
        this.puzzle = this.gameService.getMadePuzzleCopy(this.puzzleId);
      }
      else
      {
        this.makeNewPuzzle();
      }
      this.validityStatus = checkPuzzleValidity(this.puzzle);
    });
  }

  makeNewPuzzle(): void
  {
    this.puzzleId = -1;
    this.puzzle = {
      title: "New Puzzle",
      subtitle: "A puzzle hint or maybe the date.",
      groups: Array.from({length: NUMGROUPS}, (e, i) => {
        return {
          title: idToDefaultName(i),
          items: Array.from({length: GROUPSIZE}, (f, j) => "")
        };
      })
    };
  }

  saveAndExit(): void
  {
    this.validityStatus = checkPuzzleValidity(this.puzzle!);

    if (this.validityStatus == PuzzleValidityResult.Valid)
    {
      const saveId = this.gameService.saveMadePuzzle(this.puzzle, this.puzzleId);
      this.router.navigate(["/"], {fragment: `m-${saveId}`});
    }
  }

  cancel(): void
  {
    this.router.navigate(["/"], {fragment: `m-${this.puzzleId}`});
  }

  validateForm()
  {
    this.validityStatus = checkPuzzleValidity(this.puzzle!);
  }

  swapGroups(groupAIdx: number, groupBIdx: number): void
  {
    if (groupAIdx < 0 || groupAIdx >= NUMGROUPS || groupBIdx < 0 || groupBIdx >= NUMGROUPS)
    {
      return;
    }
    const groupA = this.puzzle.groups[groupAIdx];
    this.puzzle.groups[groupAIdx] = this.puzzle.groups[groupBIdx];
    this.puzzle.groups[groupBIdx] = groupA;
  }
}
