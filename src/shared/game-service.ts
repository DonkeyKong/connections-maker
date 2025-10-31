import { base64ToString, stringToBase64 } from "./base64Util";
import { PuzzleStorage, Puzzle, Guess } from "./puzzle"

export interface RoundSaveData
{
  guesses: Guess[];
  points: number;
}

export enum MergeStrategy
{
  Duplicate,
  Replace,
  Skip
}

export class GameService
{
  private _puzzles: Map<string,Puzzle>;
  private _puzzleStorage: PuzzleStorage[] = [];
  private _madePuzzleStorage: PuzzleStorage[] = [];

  constructor()
  {
    const madeJson = localStorage.getItem("MadePuzzles");
    if (madeJson)
    {
      const parsedMadePuzzles = JSON.parse(madeJson);
      if (Array.isArray(parsedMadePuzzles))
      {
        this._madePuzzleStorage = parsedMadePuzzles as PuzzleStorage[];
      }
    }

    const puzzlesBase64 = localStorage.getItem("Puzzles");
    if (puzzlesBase64)
    {
      const parsedRoundStorage = JSON.parse(base64ToString(puzzlesBase64));
      if (Array.isArray(parsedRoundStorage))
      {
        this._puzzleStorage = parsedRoundStorage as PuzzleStorage[];
      }
    }

    // Now go through the storage puzzles and make each into a round proper
    this._puzzles = new Map<string, Puzzle>();
    for (const storage of this._puzzleStorage)
    {
      const round = this.initRoundFromStorage(storage);
      this._puzzles.set(round.hash, round);
    }
  }

  private initRoundFromStorage(storage: PuzzleStorage): Puzzle
  {
    const round = new Puzzle(storage);
    const saveData = localStorage.getItem(round.hash);
    if (saveData)
    {
      const parsedSaveData = JSON.parse(saveData) as RoundSaveData;
      round.load(parsedSaveData.guesses);
    }
    return round;
  }

  public updateSave(round: Puzzle) : void
  {
    const saveData: RoundSaveData = {
      guesses: round.guesses,
      points: round.points
    }
    localStorage.setItem(round.hash, JSON.stringify(saveData));
  }

  public addRound(storage: PuzzleStorage): Puzzle | undefined
  {
    const round = this.initRoundFromStorage(storage);
    if (this._puzzles.has(round.hash))
    {
      return undefined;
    }
    this._puzzleStorage.push(storage);
    this._puzzles.set(round.hash, round);
    localStorage.setItem("Puzzles", stringToBase64(JSON.stringify(this._puzzleStorage)));
    return round;
  }

  public get puzzles() : Puzzle[]
  {
    return [...this._puzzles.values()];
  }

  public get madePuzzles() : PuzzleStorage[]
  {
    return this._madePuzzleStorage;
  }

  public getRound(hash: string) : Puzzle | undefined
  {
    return this._puzzles.get(hash);
  }

  public getMadePuzzleCopy(id: number): PuzzleStorage
  {
    // Return a deep copy of this puzzle
    return JSON.parse(JSON.stringify(this._madePuzzleStorage[id]));
  }

  public deletePuzzle(puzzleId: number): void
  {
    this._madePuzzleStorage.splice(puzzleId, 1);
    localStorage.setItem("MadePuzzles", JSON.stringify(this._madePuzzleStorage));
  }

  public saveMadePuzzle(puzzleStorage: PuzzleStorage, puzzleId: number): number
  {
    if (puzzleId < 0)
    {
      this._madePuzzleStorage.push(puzzleStorage);
      puzzleId = this._madePuzzleStorage.length-1;
    }
    else
    {
      this._madePuzzleStorage[puzzleId] = puzzleStorage;
    }
    localStorage.setItem("MadePuzzles", JSON.stringify(this._madePuzzleStorage));
    return puzzleId;
  }

  public importMadePuzzles(puzzleJson: string, mergeStrategy: MergeStrategy = MergeStrategy.Duplicate)
  {
    //puzzleFile.text().then((puzzleJson: string)=>{
      const importedPuzzles = JSON.parse(puzzleJson) as PuzzleStorage[];

      for (const importedPuzzle of importedPuzzles)
      {
        let existingPuzzleIndex = this.madePuzzles.findIndex((p)=>(p.title == importedPuzzle.title));
        if (mergeStrategy == MergeStrategy.Skip && existingPuzzleIndex != -1)
        {
          continue;
        }
        else if (mergeStrategy == MergeStrategy.Replace)
        {
          this.saveMadePuzzle(importedPuzzle, existingPuzzleIndex);
        }
        else 
        {
          this.saveMadePuzzle(importedPuzzle, -1);
        }
      }
    //});
  }
}