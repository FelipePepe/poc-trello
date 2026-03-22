import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CardFieldValue,
  CreateCustomFieldDto,
  CustomField,
  UpsertCardFieldValueDto,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CustomFieldsService {
  private readonly http = inject(HttpClient);

  getByBoard(boardId: string): Observable<CustomField[]> {
    return this.http.get<CustomField[]>(`/api/boards/${boardId}/custom-fields`);
  }

  create(boardId: string, dto: CreateCustomFieldDto): Observable<CustomField> {
    return this.http.post<CustomField>(`/api/boards/${boardId}/custom-fields`, dto);
  }

  update(
    fieldId: string,
    dto: Partial<Pick<CustomField, 'name' | 'options' | 'position'>>,
  ): Observable<CustomField> {
    return this.http.put<CustomField>(`/api/custom-fields/${fieldId}`, dto);
  }

  delete(fieldId: string): Observable<void> {
    return this.http.delete<void>(`/api/custom-fields/${fieldId}`);
  }

  upsertValue(
    cardId: string,
    fieldId: string,
    dto: UpsertCardFieldValueDto,
  ): Observable<CardFieldValue | null> {
    return this.http.put<CardFieldValue | null>(
      `/api/cards/${cardId}/field-values/${fieldId}`,
      dto,
    );
  }

  deleteValue(cardId: string, fieldId: string): Observable<void> {
    return this.http.delete<void>(`/api/cards/${cardId}/field-values/${fieldId}`);
  }
}
