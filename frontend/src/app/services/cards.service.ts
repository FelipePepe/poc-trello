import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card, CreateCardDto, UpdateCardDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private readonly http = inject(HttpClient);

  getByList(listId: string): Observable<Card[]> {
    return this.http.get<Card[]>(`/api/lists/${listId}/cards`);
  }

  getById(id: string): Observable<Card> {
    return this.http.get<Card>(`/api/cards/${id}`);
  }

  create(listId: string, dto: CreateCardDto): Observable<Card> {
    return this.http.post<Card>(`/api/lists/${listId}/cards`, dto);
  }

  update(id: string, dto: UpdateCardDto): Observable<Card> {
    return this.http.put<Card>(`/api/cards/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/cards/${id}`);
  }

  move(id: string, listId: string, position: number): Observable<Card> {
    return this.http.patch<Card>(`/api/cards/${id}/move`, { listId, position });
  }

  reorder(listId: string, orderedIds: string[]): Observable<Card[]> {
    return this.http.patch<Card[]>(`/api/lists/${listId}/cards/reorder`, { orderedIds });
  }
}
