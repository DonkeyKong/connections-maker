import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleList } from './puzzle-list';

describe('PuzzleList', () => {
  let component: PuzzleList;
  let fixture: ComponentFixture<PuzzleList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzleList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
