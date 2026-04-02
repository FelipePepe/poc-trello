import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CardsService } from './cards.service';

describe('CardsService', () => {
  let service: CardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CardsService],
    });
    service = TestBed.inject(CardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('move should PATCH move endpoint', () => {
    service.move('c1', 'l1', 2).subscribe();
    const req = httpMock.expectOne('/api/cards/c1/move');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ listId: 'l1', position: 2 });
    req.flush({ id: 'c1' });
  });

  it('delete should call card endpoint', () => {
    service.delete('c1').subscribe();
    const req = httpMock.expectOne('/api/cards/c1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getByList should call nested card endpoint', () => {
    service.getByList('l1').subscribe();
    const req = httpMock.expectOne('/api/lists/l1/cards');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById should call card detail endpoint', () => {
    service.getById('c1').subscribe();
    const req = httpMock.expectOne('/api/cards/c1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'c1' });
  });

  it('create should POST card payload', () => {
    service.create('l1', { title: 'Task' }).subscribe();
    const req = httpMock.expectOne('/api/lists/l1/cards');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'c1' });
  });

  it('update should PUT card payload', () => {
    service.update('c1', { title: 'Renamed' }).subscribe();
    const req = httpMock.expectOne('/api/cards/c1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'c1' });
  });

  it('reorder should PATCH card ordering', () => {
    service.reorder('l1', ['c2', 'c1']).subscribe();
    const req = httpMock.expectOne('/api/lists/l1/cards/reorder');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ orderedIds: ['c2', 'c1'] });
    req.flush([]);
  });
});
