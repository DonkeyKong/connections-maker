import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzlePlayer } from './puzzle-player';

describe('PuzzlePlayer', () => {
  let component: PuzzlePlayer;
  let fixture: ComponentFixture<PuzzlePlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzlePlayer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzlePlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
