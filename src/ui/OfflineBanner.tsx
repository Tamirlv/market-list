export default function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div role="status" className="offline-banner">
      לא מחובר — יסונכרן כשתחזור הקליטה
    </div>
  );
}
