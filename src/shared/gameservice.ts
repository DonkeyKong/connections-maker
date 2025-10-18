import { StorageRound, Round, Guess } from "./puzzle"

export interface RoundSaveData
{
  guesses: Guess[];
  points: number;
}

export class GameService
{
  private _storage: StorageRound[] = [];
  public _rounds: Map<string,Round>;

  constructor()
  {
    const roundsJson = localStorage.getItem("Rounds");
    if (roundsJson)
    {
      const parsedRoundStorage = JSON.parse(roundsJson);
      if (Array.isArray(parsedRoundStorage))
      {
        this._storage = parsedRoundStorage as StorageRound[];
      }
    }

    // Now go through the storage rounds and make each into a round proper
    this._rounds = new Map<string, Round>();
    for (const storage of this._storage)
    {
      const round = this.initRoundFromStorage(storage);
      this._rounds.set(round.hash, round);
    }
  }

  private initRoundFromStorage(storage: StorageRound): Round
  {
    const round = new Round(storage);
    const saveData = localStorage.getItem(round.hash);
    if (saveData)
    {
      const parsedSaveData = JSON.parse(saveData) as RoundSaveData;
      round.load(parsedSaveData.guesses);
    }
    return round;
  }

  public updateSave(round: Round) : void
  {
    const saveData: RoundSaveData = {
      guesses: round.guesses,
      points: round.points
    }
    localStorage.setItem(round.hash, JSON.stringify(saveData));
  }

  public addRound(storage: StorageRound): boolean
  {
    const round = this.initRoundFromStorage(storage);
    if (this._rounds.has(round.hash))
    {
      return false;
    }
    this._storage.push(storage);
    this._rounds.set(round.hash, round);
    localStorage.setItem("Rounds", JSON.stringify(this._storage));
    return true;
  }

  public get rounds() : Round[]
  {
    return [...this._rounds.values()];
  }
}