import { Md5 } from "ts-md5"
import { base64ToBase64Url } from "./base64url";

export const GROUPSIZE: number = 4;
export const NUMGROUPS: number = 4;
export const WRONGGUESSES: number = 4;

export const MAXBONUS: number = 2.0;
export const MINBONUS: number = 0.5;
export const BONUSDECREASE: number = 0.2;
export const BONUSPENALTY: number = 0.5;
export const MAXSTARS: number = 5;

export enum GroupValue
{
  Invalid,
  Yellow,
  Green,
  Blue,
  Purple
}

enum WordState
{
  None,
  Selected,
  Grouped
}

export enum PuzzleStatus
{
  NotStarted,
  Started,
  Complete
}

function idToValue(id: number) : GroupValue
{
  switch (id)
  {
    case 0: return GroupValue.Yellow;
    case 1: return GroupValue.Green;
    case 2: return GroupValue.Blue;
    case 3: return GroupValue.Purple;
    default: return GroupValue.Invalid;
  }
}

export function idToDefaultName(id: number) : string
{
  switch (id)
  {
    case 0: return "Easy Group";
    case 1: return "Medium Group";
    case 2: return "Hard Group";
    case 3: return "Very Hard Group";
    default: return `Group ${id+1}`;
  }
}

function groupValueBasePoints(groupValue: GroupValue) : number
{
  switch (groupValue)
  {
    case GroupValue.Yellow:
      return 10;
    case GroupValue.Green:
      return 13;
    case GroupValue.Blue:
      return 16;
    case GroupValue.Purple:
      return 20;
    default:
      return 0;
  }
}

export enum PuzzleValidityResult
{
  Valid,
  EmptyPuzzleTitle,
  EmptyGroupTitle,
  EmptyWord,
  WrongGroupCount,
  WrongGroupSize,
  DuplicateWord
}

export function checkPuzzleValidity(puzzle: PuzzleStorage): PuzzleValidityResult
{
  if (puzzle.title == "") return PuzzleValidityResult.EmptyPuzzleTitle;
  if (puzzle.groups.length != NUMGROUPS) return PuzzleValidityResult.WrongGroupCount;

  const words: string[] = []
  for (const group of puzzle.groups)
  {
    if (group.title == "") return PuzzleValidityResult.EmptyGroupTitle;
    if (group.items.length != GROUPSIZE) return PuzzleValidityResult.WrongGroupSize;
    for (const word of group.items)
    {
      if (word == "") return PuzzleValidityResult.EmptyWord;
      if (words.includes(word)) return PuzzleValidityResult.DuplicateWord;
      words.push(word);
    }
  }

  return PuzzleValidityResult.Valid;
}

export interface GroupStorage
{
  title: string;
  items: string[];
}

export interface PuzzleStorage
{
  title: string;
  subtitle: string;
  groups: GroupStorage[];
}

export class Word
{
  public readonly title: string;
  public readonly groupId: number;
  public readonly groupValue: GroupValue;
  private _state: WordState = WordState.None;

  constructor(title: string, groupId: number, groupValue: GroupValue)
  {
    this.title = title;
    this.groupId = groupId;
    this.groupValue = groupValue;
  }

  public toggleSelected(): void
  {
    if (this._state == WordState.None)
    {
      this._state = WordState.Selected;
    }
    else if (this._state == WordState.Selected)
    {
      this._state = WordState.None;
    }
  }

  public deselect(): void
  {
    if (this._state == WordState.Selected)
    {
      this._state = WordState.None;
    }
  }

  public removeFromPlay(): void
  {
    this._state = WordState.Grouped;
  }

  public get selected(): boolean
  {
    return this._state == WordState.Selected;
  }

  public get visible(): boolean
  {
    return this._state != WordState.Grouped;
  }
}

export class Group
{
  public readonly title: string;
  public readonly items: Word[];
  public readonly id: number;
  public readonly value: GroupValue;

  constructor(storage: GroupStorage, id: number)
  {
    this.title = storage.title;
    this.id = id;
    this.value = idToValue(id);
    var items: Word[] = [];
    for (const item of storage.items)
    {
      items.push(new Word(item, this.id, this.value));
    }
    this.items = items;
  }

  public get itemsString(): string
  {
    return this.items.map((val) => val.title).join(", ");
  }
}

export interface Guess
{
  words: Word[];
  isCorrect: boolean;
}

export class Puzzle
{
  // Static info about this puzzle
  public readonly title: string;
  public readonly subtitle: string;
  public readonly groups: Group[];
  public readonly startingConfig: number[] | undefined;

  // The current state of play
  public groupsFound: Group[] = [];
  public words: Word[] = [];
  public guesses: Guess[] = [];
  public points: number = 0;
  public bonusMultiplier: number = MAXBONUS;
  private loaded: boolean = false;

  constructor(PuzzleStorage: PuzzleStorage)
  {
    this.title = PuzzleStorage.title;
    this.subtitle = PuzzleStorage.subtitle;

    var groups: Group[] = [];
    for (var i=0; i < PuzzleStorage.groups.length; ++i)
    {
      groups.push(new Group(PuzzleStorage.groups[i], i));
    }
    this.groups = groups;

    // Create the starting lineup
    var startingIndexes: number[];
    if (this.startingConfig && this.startingConfig.length == GROUPSIZE*NUMGROUPS)
    {
      startingIndexes = this.startingConfig!;
    }
    else
    {
      // Create the starting config
      var indexes = Array.from({length: GROUPSIZE*NUMGROUPS}, (_, i) => i);
      startingIndexes = [];
      while (indexes.length > 0)
      {
        const randIndInd = Math.floor(Math.random() * indexes.length)
        startingIndexes.push(indexes.splice(randIndInd, 1)[0]);
      }
    }

    // Put all words in play, following the starting config or random otherwise
    for (const i of startingIndexes)
    {
      const groupInd = Math.floor(i / GROUPSIZE);
      const wordInd = i % GROUPSIZE;
      this.words.push(groups[groupInd].items[wordInd]);
    }
  }

  public isWordInPlay(word: Word) : boolean
  {
    return word.visible && this.words.includes(word);
  }

  public makeGuess(guessWords: Word[]): Guess | undefined
  {
    // Must have GROUPSIZE words
    if (guessWords.length != GROUPSIZE)
    {
      return;
    }

    // Words must be in play
    for (const word of guessWords)
    {
      if (!this.isWordInPlay(word))
      {
        return;
      }
    }

    // Check if the guess is correct
    const guess : Guess = 
    {
      words: guessWords,
      isCorrect: guessWords.filter((w) => (w.groupId == guessWords[0].groupId)).length == GROUPSIZE
    }

    // If correct, remove all the words from play, add the group, and a
    if (guess.isCorrect)
    {
      for (const guessWord of guessWords)
      {
        guessWord.removeFromPlay();
      }

      const group = this.groups[guessWords[0].groupId];

      // Add a new found group
      this.groupsFound.push(group);

      // Add points for getting group and lower bonus by a small amount
      this.points += groupValueBasePoints(group.value) * this.bonusMultiplier;
      this.bonusMultiplier -= BONUSDECREASE;
    }
    else
    {
      // No points for wrong guess, plus larger bonus decrease
      this.bonusMultiplier -= BONUSPENALTY;
    }

    // Clamp the bonus to the minimum
    this.bonusMultiplier = Math.max(this.bonusMultiplier, MINBONUS);

    // Add the guess to the play history
    this.guesses.push(guess);

    // Return the guess
    return guess;
  }

  public load(guesses: Guess[])
  {
    if (this.loaded) return;

    for (const guess of guesses)
    {
      const words = this.words.filter((word)=>{
        
        for (const guessWord of guess.words)
        {
          if (guessWord.title === word.title)
          {
            return true;
          }
        }
        return false;
      });

      this.makeGuess(words);
    }

    this.loaded = true;
  }

  public get wrongGuessesRemaining(): number
  {
    var guessesRemaining = WRONGGUESSES;
    for (const guess of this.guesses)
    {
      if (!guess.isCorrect)
      {
        guessesRemaining -= 1;
      }
      if (guessesRemaining <= 0)
      {
        break;
      }
    }
    return guessesRemaining;
  }

  public get selected(): Word[]
  {
    return this.words.filter((w) => w.selected);
  }

  public get selectedCount(): number
  {
    var count = 0;
    for (const word of this.words)
    {
      if (word.selected)
      {
        count += 1;
      }
    }
    return count;
  }

  public shuffle(): void
  {
    var shuffledWords: Word[] = [];
    var indexes = Array.from({length: this.words.length}, (_, i) => i);
    while (indexes.length > 0)
    {
      const randIndInd = Math.floor(Math.random() * indexes.length)
      shuffledWords.push(this.words[indexes.splice(randIndInd, 1)[0]]);
    }
    this.words = shuffledWords;
  }

  public deselectAll(): void
  {
    for (const word of this.words)
    {
      word.deselect();
    }
  }

  public get status(): PuzzleStatus
  {
    if (this.wrongGuessesRemaining == 0 || this.groupsFound.length == NUMGROUPS)
      return PuzzleStatus.Complete;
    if (this.guesses.length > 0)
      return PuzzleStatus.Started;
    return PuzzleStatus.NotStarted;
  }

  public get win(): boolean
  {
    return this.groupsFound.length == NUMGROUPS;
  }

  // Get an 16 character alphanumeric hash unique to this puzzle
  public get hash(): string
  {
    const int32array = Md5.hashStr(this.groups.map((g)=>g.itemsString).join("; "), true);
    const view = new DataView(int32array.buffer);
    const uni8array = new Uint8Array(int32array.length * 4);
    for (let i=0; i<int32array.length; i++) 
    {
        uni8array[i*4+0] = view.getUint8(i*4+0);
        uni8array[i*4+1] = view.getUint8(i*4+1);
        uni8array[i*4+2] = view.getUint8(i*4+2);
        uni8array[i*4+3] = view.getUint8(i*4+3);
    }

    return base64ToBase64Url(uni8array.subarray(0, 12).toBase64());
  }

  public get starScore(): number
  {
    const lowestScore = groupValueBasePoints(GroupValue.Purple) * MINBONUS + 
                        groupValueBasePoints(GroupValue.Blue) * MINBONUS + 
                        groupValueBasePoints(GroupValue.Green) * MINBONUS + 
                        groupValueBasePoints(GroupValue.Yellow) * MINBONUS;

    const highestScore = groupValueBasePoints(GroupValue.Purple) * (MAXBONUS - (BONUSDECREASE * 0)) + 
                        groupValueBasePoints(GroupValue.Blue) * (MAXBONUS - (BONUSDECREASE * 1)) + 
                        groupValueBasePoints(GroupValue.Green) * (MAXBONUS - (BONUSDECREASE * 2)) + 
                        groupValueBasePoints(GroupValue.Yellow) * (MAXBONUS - (BONUSDECREASE * 3));
    
    if (this.points == 0)
    {
      return 0;
    }
    
    const normalizedPoints = (Math.min(Math.max(this.points, lowestScore), highestScore) - lowestScore) / (highestScore - lowestScore);
    for (let i=1; i < MAXSTARS; ++i)
    {
      if (normalizedPoints < (i / (MAXSTARS-1)))
      {
        return i;
      }
    }
    return MAXSTARS;
  }

  public get starScoreText(): string
  {
    if (this.win)
    {
      switch (this.starScore)
      {
        case 1:
          return "Alright"
        case 2:
          return "Good"
        case 3:
          return "Great"
        case 4:
          return "Amazing"
        case 5:
          return "Perfect!"
        default:
          return "";
      }
    }
    else
    {
      switch (this.starScore)
      {
        case 0:
          return "Oh No"
        case 1:
          return "OK"
        case 2:
          return "Alright"
        case 3:
          return "So Close"
        case 4:
          return "Wow"
        case 5:
          return "How?"
        default:
          return "";
      }
    }

    
  }

}