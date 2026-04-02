import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BoardsService],
    });
    service = TestBed.inject(BoardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll should call /api/boards', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/boards');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create should POST board payload', () => {
    service.create({ title: 'Board' }).subscribe();
    const req = httpMock.expectOne('/api/boards');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Board' });
    req.flush({ id: 'b1', title: 'Board' });
  });

  it('getById should call board detail endpoint', () => {
    service.getById('b1').subscribe();
    const req = httpMock.expectOne('/api/boards/b1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'b1' });
  });

  it('update should PUT payload to board endpoint', () => {
    service.update('b1', { title: 'Renamed' }).subscribe();
    const req = httpMock.expectOne('/api/boards/b1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Renamed' });
    req.flush({ id: 'b1', title: 'Renamed' });
  });

  it('delete should call board endpoint', () => {
    service.delete('b1').subscribe();
    const req = httpMock.expectOne('/api/boards/b1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
