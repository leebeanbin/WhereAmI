export interface TourismItemDto {
  title: string;
  address: string;
  dist: string;
  imageUrl: string | null;
  mapX: string;
  mapY: string;
}

export interface TourismListDto {
  items: TourismItemDto[];
}
