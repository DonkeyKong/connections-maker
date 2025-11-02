import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GameService } from '../shared/game-service';

const gameService: GameService = new GameService();

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet ],
  providers: [
    { provide: GameService, useValue: gameService }
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}