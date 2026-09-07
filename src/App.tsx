import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.tsx";
import { OverviewPage } from "./pages/OverviewPage.tsx";
import { LiveMapPage } from "./pages/LiveMapPage.tsx";
import { GeoAIPage, XaiPage } from "./pages/GeoAIPages.tsx";
import { RecommendationsPage, TriagePage, VerificationPage } from "./pages/OpsPages.tsx";
import { CreditsPage, JalSaheliPage, LearningPage } from "./pages/CommunityPages.tsx";
import { AnalyticsPage, ReportsPage, SettingsPage } from "./pages/SystemPages.tsx";
import { CapturePage } from "./pages/CapturePage.tsx";
import { GeoWiseProvider } from "./store/GeoWiseProvider.tsx";

export default function App() {
  return (
    <GeoWiseProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/geo-ai" element={<GeoAIPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/xai" element={<XaiPage />} />
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/jal-saheli" element={<JalSaheliPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </GeoWiseProvider>
  );
}
