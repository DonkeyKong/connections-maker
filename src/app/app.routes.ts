import { Routes } from '@angular/router';
import { PuzzleList } from './puzzle-list/puzzle-list';
import { PuzzleMaker } from './puzzle-maker/puzzle-maker';
import { PuzzlePlayer } from './puzzle-player/puzzle-player';

export const routes: Routes = [
  {path: 'play/:hash', component: PuzzlePlayer},
  {path: 'playtest/:id', component: PuzzlePlayer},
  {path: 'make', component: PuzzleMaker},
  {path: 'make/:id', component: PuzzleMaker},
  {path: 'add/:gamedata', component: PuzzleList},
  {path: '', component: PuzzleList}
];
