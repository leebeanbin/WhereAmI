import { DEFAULT_CITY_CODE } from '../../constants/api';

export const mapRegionToCityCode = (region1DepthName: string): string => {
  if (region1DepthName.includes('서울')) return '11';
  if (region1DepthName.includes('부산')) return '21';
  if (region1DepthName.includes('대구')) return '22';
  if (region1DepthName.includes('인천')) return '23';
  if (region1DepthName.includes('광주')) return '24';
  if (region1DepthName.includes('대전')) return '25';
  if (region1DepthName.includes('울산')) return '26';
  if (region1DepthName.includes('세종')) return '29';
  if (region1DepthName.includes('경기')) return '31';
  if (region1DepthName.includes('강원')) return '32';
  if (region1DepthName.includes('충북') || region1DepthName.includes('충청북도')) return '33';
  if (region1DepthName.includes('충남') || region1DepthName.includes('충청남도')) return '34';
  if (region1DepthName.includes('전북') || region1DepthName.includes('전라북도')) return '35';
  if (region1DepthName.includes('전남') || region1DepthName.includes('전라남도')) return '36';
  if (region1DepthName.includes('경북') || region1DepthName.includes('경상북도')) return '37';
  if (region1DepthName.includes('경남') || region1DepthName.includes('경상남도')) return '38';
  if (region1DepthName.includes('제주')) return '39';
  
  return DEFAULT_CITY_CODE;
};
