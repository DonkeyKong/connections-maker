import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gameboard } from './gameboard';

describe('Gameboard', () => {
  let component: Gameboard;
  let fixture: ComponentFixture<Gameboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gameboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gameboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
