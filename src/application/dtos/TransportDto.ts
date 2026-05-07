export interface BusScheduleDto {
  vehicleId: string;
  lineNo: string;
  estimatedArrivalTime: Date;
  currentStop: string;
}

export interface SubwayArrivalDto {
  lineId: string;
  trainLineNm: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
  recptnDt: string;
}

export interface TrainDto {
  trainNo: string;
  trainType: string;
  trainTypeName: string;
  depPlaceName: string;
  arrPlaceName: string;
  depPlandTime: string;
  arrPlandTime: string;
  adultCharge: number;
}
