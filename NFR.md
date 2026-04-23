# Non-Functional Requirements (NFR)

Dokumen ini mendefinisikan kebutuhan non-fungsional untuk website secara **terukur, dapat diuji, dan siap audit**.

## 1) Ruang Lingkup dan Definisi

- **Sistem**: Website utama + API + database + infrastruktur pendukung.
- **Environment**: Production.
- **Pengukuran utama**:
  - **P95**: 95% request berada di bawah ambang target.
  - **Uptime**: Persentase layanan tersedia dalam periode tertentu.
  - **RTO/RPO**: Recovery Time Objective / Recovery Point Objective.

## 2) Matriks NFR (Final)

| ID | Kategori | Requirement | Target Terukur (Acceptance Criteria) | Prioritas |
|---|---|---|---|---|
| NFR-PERF-01 | Performa | Waktu muat halaman | P95 page load < 3 detik pada jaringan 2 Mbps | Must |
| NFR-PERF-02 | Performa | TTFB | P95 TTFB < 800 ms | Should |
| NFR-PERF-03 | Performa | Core Web Vitals | LCP < 2.5s, INP < 200ms, CLS < 0.1 (P75) | Must |
| NFR-SCALE-01 | Skalabilitas | Concurrent users | Mampu menangani 100.000 user aktif bersamaan | Must |
| NFR-SCALE-02 | Skalabilitas | Kinerja saat beban puncak | Error rate < 1%, P95 API latency < 1.5 detik saat peak | Must |
| NFR-LB-01 | Infrastruktur | Load balancing | Seluruh trafik masuk via L7 Load Balancer + health check aktif | Must |
| NFR-LB-02 | Infrastruktur | Failover | Kegagalan node tidak menyebabkan downtime > 60 detik | Must |
| NFR-SEC-01 | Keamanan | Enkripsi in-transit | HTTPS wajib, TLS 1.2+ (prefer 1.3), HSTS aktif | Must |
| NFR-SEC-02 | Keamanan | 2FA admin | Semua akun admin wajib 2FA | Must |
| NFR-SEC-03 | Keamanan | Perlindungan serangan web | SQLi/XSS terdeteksi dan diblokir oleh WAF/IDS, alert < 1 detik | Must |
| NFR-SEC-04 | Keamanan | Kerahasiaan kredensial | Password di-hash (Argon2/bcrypt), tidak ada plain text secret di repo | Must |
| NFR-AVAIL-01 | Ketersediaan | Uptime | >= 99.9% per tahun | Must |
| NFR-DR-01 | Ketahanan | Disaster recovery | RTO <= 1 jam, RPO <= 24 jam | Must |
| NFR-BACKUP-01 | Ketahanan | Backup data | Backup otomatis setiap 24 jam + verifikasi restore berkala | Must |
| NFR-UX-01 | UX/UI | Responsif | Tampilan optimal desktop/tablet/mobile (breakpoint utama lulus QA) | Must |
| NFR-A11Y-01 | Aksesibilitas | WCAG | Minimal WCAG 2.1 level AA | Must |
| NFR-UX-02 | UX/UI | Navigasi | Task utama dapat dicapai maksimal 3 klik dari dashboard | Should |
| NFR-COMP-01 | Kompatibilitas | Browser | Chrome/Firefox/Edge/Safari/Opera (2 versi terbaru + 1 sebelumnya) | Must |
| NFR-COMP-02 | Kompatibilitas | OS | Windows, macOS, Android, iOS | Must |
| NFR-OPS-01 | Operasional | Logging | Audit log + error log + access log tersimpan terpusat | Must |
| NFR-OPS-02 | Operasional | Monitoring | Monitoring 24/7 (aplikasi, DB, infrastruktur) dengan alert otomatis | Must |
| NFR-OPS-03 | Operasional | Planned downtime | Total downtime maintenance <= 30 menit/bulan | Should |
| NFR-COMP-REG-01 | Kepatuhan | GDPR | Consent, data minimization, right-to-access, right-to-erasure terpenuhi | Must (jika ada user EU) |
| NFR-COMP-REG-02 | Kepatuhan | PCI DSS | Wajib jika proses pembayaran kartu dilakukan sistem | Conditional Must |
| NFR-REL-01 | Keandalan | Stress & spike test | Lulus stress/spike test sebelum rilis mayor | Must |
| NFR-REL-02 | Keandalan | SLO reliability | SLO availability/latency/error-rate terdokumentasi dan dipantau | Must |
| NFR-INT-01 | Interoperabilitas | Integrasi API | Mendukung REST/GraphQL terstandarisasi + dokumentasi API | Must |
| NFR-INT-02 | Interoperabilitas | Protokol komunikasi | Komunikasi via HTTP/HTTPS, JSON, dan WebSocket bila real-time | Should |

## 3) Metode Verifikasi per Kategori

### 3.1 Performa dan Skalabilitas
- Tool: Lighthouse, WebPageTest, k6/JMeter/Gatling.
- Skenario: normal load, peak load, spike load.
- Bukti: laporan benchmark, grafik P95/P99, error rate.

### 3.2 Keamanan
- Tool: OWASP ZAP, SAST, dependency scan, WAF log.
- Skenario: SQLi/XSS payload test, brute force test, TLS config audit.
- Bukti: hasil scan tanpa finding kritikal yang tidak ditangani.

### 3.3 Ketersediaan dan Ketahanan
- Tool: uptime monitor + observability dashboard.
- Skenario: chaos/failover drill, restore backup drill.
- Bukti: catatan incident, bukti RTO/RPO tercapai.

### 3.4 UX/UI, Aksesibilitas, dan Kompatibilitas
- Tool: axe/Lighthouse a11y, BrowserStack/device farm.
- Skenario: regression UI di browser/OS target.
- Bukti: checklist QA lintas device + hasil audit WCAG.

### 3.5 Operasional dan Kepatuhan
- Tool: centralized logging (SIEM), policy compliance checklist.
- Bukti: retention log, SOP incident, SOP backup/restore, rekam audit.

## 4) SLO/SLI (Operasional Harian)

- **SLI Availability**: success request ratio.
- **SLI Latency**: P95 response time endpoint kritikal.
- **SLI Error Rate**: 5xx + failed transaction ratio.
- **SLO target bulanan**:
  - Availability >= 99.9%
  - P95 API latency < 1.5 detik (endpoint kritikal)
  - Error rate < 1%

## 5) Checklist Rilis (Gate)

Rilis production **ditolak** bila salah satu kondisi berikut gagal:
- NFR-PERF-01 / NFR-SCALE-02 gagal.
- NFR-SEC-01 / NFR-SEC-02 / NFR-SEC-03 gagal.
- NFR-AVAIL-01 readiness belum ada.
- NFR-BACKUP-01 belum tervalidasi restore.
- NFR-A11Y-01 audit belum memenuhi minimal AA untuk halaman utama.

## 6) Catatan Implementasi Praktis

- Terapkan caching bertingkat (CDN + app cache) untuk menekan latency.
- Gunakan autoscaling dan connection pooling database.
- Aktifkan WAF + rate limiting + CSP + secure headers.
- Pisahkan rahasia ke secret manager, bukan `.env` yang terekspos.
- Jalankan backup otomatis + uji restore terjadwal (minimal bulanan).

---

Dokumen ini dapat dijadikan baseline NFR pada SRS, QA plan, dan audit readiness.
