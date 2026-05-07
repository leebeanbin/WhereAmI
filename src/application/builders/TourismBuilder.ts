import { TourismItemDto, TourismListDto } from '../dtos/TourismDto';

export class TourismBuilder {
  static fromRaw(item: Record<string, any>): TourismItemDto {
    return {
      title: item.title,
      address: item.addr1,
      dist: item.dist,
      imageUrl: item.firstimage || null,
      mapX: item.mapx,
      mapY: item.mapy,
    };
  }

  static fromRawList(items: Record<string, any>[]): TourismListDto {
    return { items: items.map(TourismBuilder.fromRaw) };
  }
}
