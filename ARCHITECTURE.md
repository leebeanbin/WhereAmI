# 🏗️ Architecture & Design Patterns

이 문서는 **Where Am I?** 프로젝트에 적용된 아키텍처 철학과 디자인 패턴들을 상세히 설명합니다. 
단순한 토이 프로젝트를 넘어, **엔터프라이즈 수준의 확장성과 유지보수성**을 갖추기 위해 다음과 같은 구조적 고민을 담았습니다.

---

## 1. Clean Architecture (계층 분리)
React 컴포넌트 내부에 비즈니스 로직과 API 통신 코드가 혼재되는 스파게티 코드를 방지하기 위해, 프로젝트를 **3-Tier Architecture**로 엄격히 분리했습니다.

* **`domain/`**: 외부 라이브러리나 UI에 전혀 의존하지 않는 순수한 비즈니스 모델(`Journey`, `RoutePoint`)과 인터페이스(`IJourneyRepository`, `IPublicTransportAdapter`)가 위치합니다.
* **`application/`**: 사용자의 유스케이스를 처리합니다. `useTrackingFacade`와 같은 Facade 패턴을 통해 복잡한 상태 변경 로직을 캡슐화하고, `TransportIconFactory`를 통해 로직 처리를 담당합니다.
* **`infrastructure/`**: 외부 API 연동(`TagoApiAdapter`), 브라우저 하드웨어 제어(`GeolocationAdapter`), DB 연동(`FirebaseJourneyRepository`) 등 외부 세계와의 통신을 구현합니다.

<br/>

## 2. BFF (Backend-For-Frontend) 패턴
공공데이터(TAGO API)를 프론트엔드에서 직접 호출(Direct Call)할 때 발생하는 치명적인 단점들을 해결하기 위해 **BFF 패턴**을 도입했습니다.

### ❌ As-is (직접 호출의 문제점)
* **보안 취약점:** 클라이언트 코드에 정부 공공데이터 API 키가 노출됨.
* **CORS 에러:** 공공데이터 서버 설정에 따라 프론트엔드 직접 호출 시 CORS 블록 발생.
* **페이로드 낭비:** 불필요하게 거대한 XML/JSON 응답을 모바일 기기에서 모두 파싱해야 함.

### 🟢 To-be (BFF 도입 후)
* Next.js의 API Routes(`src/app/api/...`)를 미들웨어로 구축.
* API 키는 서버(`.env.local`)에만 안전하게 보관.
* 거대한 응답 데이터를 서버에서 가볍고 정제된 형태(`TransportSchedule` 모델)로 변환하여 프론트엔드에 전달.
* **Swagger** 연동(`next-swagger-doc`)을 통해 BFF API 명세서를 자동화하여 DX(Developer Experience) 향상.

<br/>

## 3. 적용된 주요 Design Patterns

### 🧩 Facade Pattern (`useTrackingFacade.ts`)
* **문제:** `MapComponent`나 `Page` 컴포넌트에서 GPS를 켜고 끄고, 속도를 계산하고, Zustand 스토어를 업데이트하는 모든 로직을 직접 들고 있으면 컴포넌트가 너무 비대해집니다.
* **해결:** `useTrackingFacade`라는 단일 창구(Facade)를 만들어 프론트엔드 컴포넌트는 오직 `startTracking()`, `stopTracking()` 메서드만 호출하게 만들었습니다. UI는 오직 '그리는 역할'에만 집중합니다.

### 🔌 Adapter Pattern (`TagoApiAdapter.ts`)
* **문제:** 외부 공공데이터 API의 응답 스펙(필드명 등)이 변경되면 앱 전체의 코드가 깨질 위험이 있습니다.
* **해결:** `IPublicTransportAdapter`라는 도메인 인터페이스를 정의하고, 이를 구현하는 `TagoApiAdapter` 클래스를 만들었습니다. 외부 데이터 포맷이 아무리 더러워도 어댑터 내부에서 깔끔한 우리 앱만의 모델(`TransportSchedule`)로 변환(Adapt)하여 반환합니다.

### 🏭 Factory Pattern (`TransportIconFactory.ts`)
* **문제:** 이동 수단, 속도, 성별, 버스 색상 등 다양한 조건에 따라 지도 마커 아이콘 경로를 결정하는 `if-else` 지옥이 컴포넌트 내부에 생깁니다.
* **해결:** 아이콘 경로 문자열 생성을 전담하는 팩토리 클래스를 만들어 컴포넌트 코드를 깨끗하게 유지했습니다.

### 🛡 Spring-Style Global Exception Handler
* Java Spring 프레임워크의 `@ControllerAdvice` 패턴을 차용했습니다.
* 에러 메시지를 하드코딩하지 않고, `ErrorCode.ts` (Enum)를 통해 **중앙 집중식으로 관리**합니다.
* 에러가 발생하면 `AppError` 객체를 던지고, 이를 `GlobalExceptionHandler`가 인터셉트하여 사용자에게 예쁜 픽셀 토스트 메시지나 로깅을 일관되게 처리합니다.
