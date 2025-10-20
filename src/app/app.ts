import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

import { GameService } from '../shared/game-service';

const gameService: GameService = new GameService();

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, MatButtonModule ],
  providers: [{ provide: GameService, useValue: gameService }],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private subscription?: Subscription;
  private _showBackButton: boolean = false;
  
  constructor(private gameService: GameService,
              private route: ActivatedRoute,
              private router: Router)
  {
  }

  ngOnInit(): void {
    this.subscription = this.router.events.subscribe((val)=>{
      if (val instanceof NavigationEnd)
      {
        if (val.url == "" || val.url == "/" || val.url.startsWith("/add") || val.url.startsWith("/make"))
        {
          this._showBackButton = false;
        }
        else
        {
          this._showBackButton = true;
        }
      }
    });
  }

  public get showBackButton(): boolean
  {
    return this._showBackButton;
  }

  public navigateToMenu(): void
  {
    this.router.navigate(["/"]);
  }
}
