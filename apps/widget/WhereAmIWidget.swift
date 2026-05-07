import WidgetKit
import SwiftUI

// MARK: - BFF API Models

struct JourneyStats: Codable {
    let totalDistanceKm: Double
    let totalDurationSec: Int
    let journeyCount: Int
}

// MARK: - Timeline Entry

struct JourneyEntry: TimelineEntry {
    let date: Date
    let stats: JourneyStats?
}

// MARK: - Provider

struct JourneyProvider: TimelineProvider {
    /// BFF 배포 URL — apps/mobile/app.json의 bffBaseUrl과 동일하게 유지
    private let bffBaseURL = "https://whereami.vercel.app"

    func placeholder(in context: Context) -> JourneyEntry {
        JourneyEntry(date: .now, stats: JourneyStats(totalDistanceKm: 12.3, totalDurationSec: 3600, journeyCount: 5))
    }

    func getSnapshot(in context: Context, completion: @escaping (JourneyEntry) -> Void) {
        fetchStats { stats in
            completion(JourneyEntry(date: .now, stats: stats))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<JourneyEntry>) -> Void) {
        fetchStats { stats in
            let entry = JourneyEntry(date: .now, stats: stats)
            // 1시간마다 새로고침
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    private func fetchStats(completion: @escaping (JourneyStats?) -> Void) {
        // BFF의 /api/history/stats 엔드포인트 호출 (추후 구현 필요)
        // 현재는 /api/* 중 여정 통계를 반환하는 엔드포인트가 없으므로 stub
        guard let url = URL(string: "\(bffBaseURL)/api/history/stats?userId=anonymous") else {
            completion(nil)
            return
        }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data else { completion(nil); return }
            let stats = try? JSONDecoder().decode(JourneyStats.self, from: data)
            completion(stats)
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
                Text(formatDistance(stats.totalDistanceKm))
                    .font(.system(.title, design: .monospaced, weight: .bold))
                Text("\(stats.journeyCount)회 모험")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(.secondary)
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
        km < 1 ? "\(Int(km * 1000))m" : String(format: "%.2fkm", km)
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
        .description("나의 모험 통계를 한눈에 확인")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
