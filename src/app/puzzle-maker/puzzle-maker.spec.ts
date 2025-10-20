import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleMaker } from './puzzle-maker';

describe('PuzzleMaker', () => {
  let component: PuzzleMaker;
  let fixture: ComponentFixture<PuzzleMaker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleMaker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzleMaker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
