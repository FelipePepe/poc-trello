import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board, CreateBoardDto, UpdateBoardDto } from '../models';

@Injectable({ providedIn: 'root' })
export class BoardsService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/boards';

  getAll(): Observable<Board[]> {
    return this.http.get<Board[]>(this.base);
  }

  getById(id: string): Observable<Board> {
    return this.http.get<Board>(`${this.base}/${id}`);
  }

  create(dto: CreateBoardDto): Observable<Board> {
    return this.http.post<Board>(this.base, dto);
  }

  update(id: string, dto: UpdateBoardDto): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
