import WidgetKit
import SwiftUI

// MARK: - BFF API Models

/// BFF의 { success: true, data: T } 공통 응답 래퍼
struct BFFResponse<T: Codable>: Codable {
    let success: Bool
    let data: T
}

struct ActiveSession: Codable {
    let isTracking: Bool
    let speedKmh: Double
    let mode: String
}

struct JourneyStats: Codable {
    let totalDistanceKm: Double
    let totalDurationSec: Int
    let journeyCount: Int
    let activeSession: ActiveSession?
}

// MARK: - Timeline Entry

struct JourneyEntry: TimelineEntry {
    let date: Date
    let stats: JourneyStats?
}

// MARK: - Constants

#if DEBUG
private let bffBaseURL = "http://localhost:3000"
#else
private let bffBaseURL = "https://whereami.vercel.app"
#endif

private let refreshHours  = 1
private let metersPerKm   = 1000.0
private let secsPerHour   = 3600
private let secsPerMinute = 60

// MARK: - Provider

struct JourneyProvider: TimelineProvider {

    func placeholder(in context: Context) -> JourneyEntry {
        JourneyEntry(date: .now, stats: JourneyStats(
            totalDistanceKm: 12.3,
            totalDurationSec: 3661,
            journeyCount: 5,
            activeSession: ActiveSession(isTracking: false, speedKmh: 0, mode: "도보 🚶")
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (JourneyEntry) -> Void) {
        fetchStats { completion(JourneyEntry(date: .now, stats: $0)) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<JourneyEntry>) -> Void) {
        fetchStats { stats in
            let entry = JourneyEntry(date: .now, stats: stats)
            // 활성 추적 상태일 때는 더 빠르게(예: 1분 마다) 갱신하도록 구성 가능
            let refreshMinutes = (stats?.activeSession?.isTracking == true) ? 1 : 30
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: refreshMinutes, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    private func fetchStats(completion: @escaping (JourneyStats?) -> Void) {
        guard let url = URL(string: "\(bffBaseURL)/api/history/stats?userId=anonymous") else {
            DispatchQueue.main.async { completion(nil) }; return
        }
        URLSession.shared.dataTask(with: url) { data, response, _ in
            let result: JourneyStats? = {
                guard let data else { return nil }
                let decoded = try? JSONDecoder().decode(BFFResponse<JourneyStats>.self, from: data)
                return decoded?.success == true ? decoded?.data : nil
            }()
            DispatchQueue.main.async { completion(result) }
        }.resume()
    }
}

// MARK: - Widget View

struct WhereAmIWidgetView: View {
    let entry: JourneyEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Where Am I?")
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)

            if let stats = entry.stats {
                if let active = stats.activeSession, active.isTracking {
                    // 실시간 모험 활성화 위젯 뷰
                    VStack(alignment: .leading, spacing: 4) {
                        Text("🏃 모험 진행 중!")
                            .font(.system(.caption2, design: .monospaced, weight: .bold))
                            .foregroundColor(.red)
                        Text(String(format: "%.1f km/h", active.speedKmh))
                            .font(.system(.title, design: .monospaced, weight: .bold))
                            .foregroundColor(.primary)
                        Text(active.mode)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                } else {
                    // 기존 통계 데이터 뷰
                    Text(formatDistance(stats.totalDistanceKm))
                        .font(.system(.title, design: .monospaced, weight: .bold))
                    Text(formatDuration(stats.totalDurationSec))
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundColor(.secondary)
                    Text("\(stats.journeyCount)회 모험")
                        .font(.system(.caption, design: .monospaced))
                        .foregroundColor(.secondary)
                }
            } else {
                Text("데이터 없음")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Color(red: 0.88, green: 0.91, blue: 0.88))
    }

    private func formatDistance(_ km: Double) -> String {
        km < 1 ? "\(Int(km * metersPerKm))m" : String(format: "%.2fkm", km)
    }

    private func formatDuration(_ sec: Int) -> String {
        if sec < secsPerMinute { return "\(sec)초" }
        let m = sec / secsPerMinute
        if m < secsPerMinute { return "\(m)분" }
        return "\(m / 60)시간 \(m % 60)분"
    }
}

// MARK: - Widget Configuration

@main
struct WhereAmIWidget: Widget {
    let kind = "WhereAmIWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: JourneyProvider()) { entry in
            WhereAmIWidgetView(entry: entry)
        }
        .configurationDisplayName("Where Am I?")
        .description("나의 모험 통계 및 실시간 모험 상태 확인")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Previews

#Preview("Small — 실시간 모험 중", as: .systemSmall) {
    WhereAmIWidget()
} timeline: {
    JourneyEntry(date: .now, stats: JourneyStats(
        totalDistanceKm: 12.3,
        totalDurationSec: 3661,
        journeyCount: 5,
        activeSession: ActiveSession(isTracking: true, speedKmh: 42.5, mode: "지하철 🚆")
    ))
}

#Preview("Small — 일반 통계", as: .systemSmall) {
    WhereAmIWidget()
} timeline: {
    JourneyEntry(date: .now, stats: JourneyStats(
        totalDistanceKm: 12.3,
        totalDurationSec: 3661,
        journeyCount: 5,
        activeSession: ActiveSession(isTracking: false, speedKmh: 0, mode: "도보 🚶")
    ))
}

#Preview("Small — 데이터 없음", as: .systemSmall) {
    WhereAmIWidget()
} timeline: {
    JourneyEntry(date: .now, stats: nil)
}

#Preview("Medium — 실시간 모험 중", as: .systemMedium) {
    WhereAmIWidget()
} timeline: {
    JourneyEntry(date: .now, stats: JourneyStats(
        totalDistanceKm: 48.7,
        totalDurationSec: 7320,
        journeyCount: 12,
        activeSession: ActiveSession(isTracking: true, speedKmh: 24.8, mode: "버스 🚌")
    ))
}

#Preview("Medium — 데이터 없음", as: .systemMedium) {
    WhereAmIWidget()
} timeline: {
    JourneyEntry(date: .now, stats: nil)
}
