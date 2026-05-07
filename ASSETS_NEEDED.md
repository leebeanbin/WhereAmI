# 필요한 에셋 목록

> 기존 이미지 스타일: 마인크래프트/스타듀밸리 감성 픽셀아트, 투명 배경(PNG), 48x48 ~ 128x128px

---

## 지도 마커 (Map Markers)

현재 `bus_stop.svg`는 단순 기하 도형이라 다른 PNG들과 감성이 맞지 않음.
아래 항목들을 **투명 배경 픽셀아트 PNG**로 교체 권장.

| 파일명 | 용도 | 비고 |
|--------|------|------|
| `public/icons/bus_stop.svg` → **PNG로 교체** | 지도 위 버스 정류장 마커 | 노란 버스 정류장 표지판 느낌, 폴대 포함 |
| `public/icons/subway_station.svg` → **PNG로 교체** | 지도 위 지하철역 마커 | 서울 지하철 출입구 느낌 (파란색 계열) |
| `public/icons/train_station.svg` → **PNG로 교체** | 지도 위 기차역 마커 | KTX/코레일 역 건물 느낌 (남색/빨간 포인트) |

---

## 기존 이미지 수정 필요

| 파일명 | 문제 | 요청 |
|--------|------|------|
| `public/icons/banana.png` | **파란 배경 있음** (투명 배경 아님) | 배경 제거한 버전으로 교체 |

---

## 미래 기능용 (아직 코드 미연결, 준비만 해두면 됨)

### 서울 지하철 호선별 열차 아이콘
현재 1호선(남색), 2호선(초록)만 있음. 추가 시 코드 자동 반영 가능.

| 파일명 | 호선 | 색상 |
|--------|------|------|
| `public/icons/train_seoul_3.png` | 3호선 | 주황 (#EF7C1C) |
| `public/icons/train_seoul_4.png` | 4호선 | 하늘 (#00A5DE) |
| `public/icons/train_seoul_5.png` | 5호선 | 보라 (#996CAC) |
| `public/icons/train_seoul_6.png` | 6호선 | 갈색 (#CD7C2F) |
| `public/icons/train_seoul_7.png` | 7호선 | 올리브 (#747F00) |
| `public/icons/train_seoul_8.png` | 8호선 | 분홍 (#E6186C) |
| `public/icons/train_seoul_9.png` | 9호선 | 금색 (#BDB092) |

### 버스 타입 아이콘 (이미 코드에 준비됨, 파일은 있음)
현재 파일은 있으나 실제 API 데이터와 미연결 상태.
추후 버스 노선 색상 API 연동 시 자동 활용됨.

---

## 현재 에셋 상태 요약

```
public/icons/
├── banana.png          ⚠️  파란 배경 → 교체 필요
├── bike.png            ✅  사용 중 (factory)
├── bus_blue.png        ✅  사용 중 (기본 버스)
├── bus_green.png       ✅  준비됨 (API 연동 후 활성화)
├── bus_red.png         ✅  준비됨 (API 연동 후 활성화)
├── bus_stop.svg        ⚠️  픽셀 감성 부족 → PNG 교체 권장
├── bus_yellow.png      ✅  준비됨 (API 연동 후 활성화)
├── subway_station.svg  ⚠️  픽셀 감성 부족 → PNG 교체 권장
├── train_seoul_1.png   ✅  사용 중 (기본 열차)
├── train_seoul_2.png   ✅  준비됨 (API 연동 후 활성화)
├── train_station.svg   ⚠️  픽셀 감성 부족 → PNG 교체 권장
├── walk_man.png        ✅  사용 중 (기본 도보)
└── walk_woman.png      ✅  준비됨 (설정 연동 후 활성화)
```
