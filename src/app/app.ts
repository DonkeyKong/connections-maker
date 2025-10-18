import { Component, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Word, StorageRound, GroupValue, Round, GROUPSIZE } from '../shared/puzzle';
import { GameService, RoundSaveData } from '../shared/gameservice';
import { base64ToBase64Url, base64UrlToBase64 } from '../shared/base64url';
import { GzipBase64Compressor } from '../shared/gzip-base64-compressor';
import { toCanvas as qrToCanvas } from 'qrcode'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatButtonModule ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  protected readonly title = signal('connections-maker');

  public round?: Round;
  public readonly GroupValueEnum = GroupValue;
  private gameService: GameService;
  
    // its important myCanvas matches the variable name in the template
  @ViewChild('qrCodeCanvas', {static: false})
  canvas: ElementRef<HTMLCanvasElement> | null = null;
  context: CanvasRenderingContext2D | null | undefined = null;

  constructor()
  {
    this.gameService = new GameService();

    const storageArray : StorageRound[] = [
      // {
      //   "title": "December 19th",
      //   "description": "Don't Look Up",
      //   "groups": [
      //     {
      //       "title": "Mythical Creatures in Constellations",
      //       "items": ["Unicorn", "Hydra", "Pegasus", "Phoenix"]
      //     },
      //     {
      //       "title": "Local Names for Mountain Lions",
      //       "items": ["Cougar", "Puma", "Panther", "Catamount"]
      //     },
      //     {
      //       "title": "Western Zodiac Animals",
      //       "items": ["Bull", "Lion", "Crab", "Scorpion"]
      //     },
      //     {
      //       "title": "Chinese Zodiac Animals",
      //       "items": ["Ox", "Tiger", "Horse", "Pig"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 20th",
      //   "description": "Machinations",
      //   "groups": [
      //     {
      //       "title": "Washing machine cycles",
      //       "items": ["Spin", "Rinse", "Soak", "Wash"]
      //     },
      //     {
      //       "title": "Tired",
      //       "items": ["Beat", "Weary", "Bushed", "Spent"]
      //     },
      //     {
      //       "title": "Collection of songs",
      //       "items": ["Mix", "Set", "Playlist", "Repertoire"]
      //     },
      //     {
      //       "title": "One-Two Buckle My...",
      //       "items": ["Shoe", "Door", "Sticks", "Straight"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 21st",
      //   "description": "NYT Would Never",
      //   "groups": [
      //     {
      //       "title": "To eat quickly",
      //       "items": ["Wolf", "Gobble", "Scarf", "Bolt"]
      //     },
      //     {
      //       "title": "Blood-takers",
      //       "items": ["Mosquito", "Vampire", "Tick", "Phlebotomist"]
      //     },
      //     {
      //       "title": "___-ass",
      //       "items": ["Kick", "Bad", "Dumb", "Swamp"]
      //     },
      //     {
      //       "title": "McDonaldland Residents",
      //       "items": ["Clown", "Monster", "Bird", "Thief"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 22nd",
      //   "description": "Almost Christmas",
      //   "groups": [
      //     {
      //       "title": "Pine tree products",
      //       "items": ["Pitch", "Needle", "Cone", "Nuts"]
      //     },
      //     {
      //       "title": "Candy ___",
      //       "items": ["Cane", "Necklace", "Corn", "Apple"]
      //     },
      //     {
      //       "title": "Things with Trunks",
      //       "items": ["Elephant", "Tree", "Car", "Attic"]
      //     },
      //     {
      //       "title": "Wearable Plant Crafts",
      //       "items": ["Garland", "Lei", "Coronet", "Chaplet"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 23rd",
      //   "description": "Here we Come A-wassailing!",
      //   "groups": [
      //     {
      //       "title": "Up on the Rooftop",
      //       "items": ["Paws", "Klaus", "Toys", "Joys"]
      //     },
      //     {
      //       "title": "Jingle Bells",
      //       "items": ["Snow", "Sleigh", "Go", "Way"]
      //     },
      //     {
      //       "title": "O Holy Night",
      //       "items": ["Night", "Shining", "Birth", "Pining"]
      //     },
      //     {
      //       "title": "All I Want For Christmas is You",
      //       "items": ["Christmas", "Need", "Presents", "Tree"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 24th",
      //   "description": "Christmas Classics",
      //   "groups": [
      //     {
      //       "title": "Miracle on 34th Street (1947)",
      //       "items": ["Macy's", "Dead Letters", "Trial", "Dream House"]
      //     },
      //     {
      //       "title": "It's a Wonderful Life (1946)",
      //       "items": ["Money", "Angel", "Potter", "Bell"]
      //     },
      //     {
      //       "title": "Rudolph The Red-Nosed Reindeer (1964)",
      //       "items": ["Dentist", "Prospector", "Yeti", "Misfits"]
      //     },
      //     {
      //       "title": "Elf (2003)",
      //       "items": ["Orphan", "Snowball Fight", "Publisher", "Sugar"]
      //     }
      //   ]
      // },
      // {
      //   "title": "December 25th",
      //   "description": "Merry Christmas, everyone!",
      //   "groups": [
      //     {
      //       "title": "Holiday vocal performance",
      //       "items": ["Carol", "Wassail", "Sing", "Belt"]
      //     },
      //     {
      //       "title": "Reindeer Actions",
      //       "items": ["Dash", "Dance", "Prance", "Blitz"]
      //     },
      //     {
      //       "title": "Frosty's Head Decor",
      //       "items": ["Pipe", "Button", "Coal", "Hat"]
      //     },
      //     {
      //       "title": "Santa's Second Name",
      //       "items": ["Claus", "Nicholas", "Kringle", "Noel"]
      //     }
      //   ]
      // }
    ];

    for (const storage of storageArray )
    {
      this.gameService.addRound(storage);
    }

    this.round = this.gameService.rounds[0];
    
  }

  ngAfterViewInit(): void {
    this.context = this.canvas?.nativeElement.getContext('2d');

    // GzipBase64Compressor.compressObject(this.roundStorageArray).then((compressedValue) => {
    
    //   const qrCodeurl = `http://bubbulon.com/cm/add/${base64ToBase64Url(compressedValue)}`;

    //   if (this.canvas)
    //   {
    //     qrToCanvas(this.canvas.nativeElement, qrCodeurl);
    //   }

    //   GzipBase64Compressor.decompressObject<StorageRound[]>(compressedValue).then((decompressedValue) => {
    //     this.round = new Round(decompressedValue[0]);
    //   });
    // });

  }

  public onClick(word: Word)
  {
    if (!this.round!.complete && (this.round!.selectedCount < GROUPSIZE || word.selected))
    {
      word.toggleSelected();
    }
  }

  public shuffle(): void
  {
    this.round!.shuffle();
  }

  public deselectAll(): void
  {
    this.round!.deselectAll();
  }

  public submit(): void
  {
    if (this.round!.wrongGuessesRemaining > 0)
    {
      this.round!.makeGuess(this.round!.selected);
      this.gameService.updateSave(this.round!);
    }
  }

}
