import { Md5 } from "ts-md5"
import { base64ToBase64Url } from "./base64url";
import { GameService } from "./gameservice";

export const GROUPSIZE: number = 4;
export const NUMGROUPS: number = 4;
export const WRONGGUESSES: number = 4;

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

export interface StorageGroup
{
  title: string;
  items: string[];
}

export interface StorageRound
{
  title: string;
  description: string;
  groups: StorageGroup[];
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

  constructor(storage: StorageGroup, id: number)
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

export class Round
{
  // Static info about this round
  public readonly title: string;
  public readonly description: string;
  public readonly groups: Group[];
  public readonly startingConfig: number[] | undefined;

  // The current state of play
  public groupsFound: Group[] = [];
  public words: Word[] = [];
  public guesses: Guess[] = [];
  public points: number = 0;
  private loaded: boolean = false;

  constructor(storageRound: StorageRound)
  {
    this.title = storageRound.title;
    this.description = storageRound.description;

    var groups: Group[] = [];
    for (var i=0; i < storageRound.groups.length; ++i)
    {
      groups.push(new Group(storageRound.groups[i], i));
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

      // Add a new found group
      this.groupsFound.push(this.groups[guessWords[0].groupId]);
    }

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

  public get complete(): boolean
  {
    return this.wrongGuessesRemaining == 0 || this.groupsFound.length == NUMGROUPS;
  }

  public get win(): boolean
  {
    return this.groupsFound.length == NUMGROUPS;
  }

  // Get an 16 character alphanumeric hash unique to this round
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

}