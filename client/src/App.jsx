import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useGame } from './store.jsx';
import Shell from './components/Shell.jsx';
import Celebrations from './components/Celebrations.jsx';
import SessionGuard from './components/SessionGuard.jsx';
import Welcome from './pages/Welcome.jsx';
import Profiles from './pages/Profiles.jsx';
import Creator from './pages/Creator.jsx';
import Town from './pages/Town.jsx';
import Worlds from './pages/Worlds.jsx';
import WorldMap from './pages/WorldMap.jsx';
import Play from './pages/Play.jsx';
import Review from './pages/Review.jsx';
import Quests from './pages/Quests.jsx';
import Trophies from './pages/Trophies.jsx';
import Shop from './pages/Shop.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { family, active, profiles, settings } = useGame();
  let routes;
  if (!family) {
    routes = (
      <Routes>
        <Route path="*" element={<Welcome />} />
      </Routes>
    );
  } else if (!active) {
    routes = (
      <Routes>
        <Route path="/create" element={<Creator />} />
        <Route path="*" element={Object.keys(profiles).length ? <Profiles /> : <Navigate to="/create" replace />} />
      </Routes>
    );
  } else {
    routes = (
      <Routes>
        <Route element={<Shell />}>
          <Route path="/town" element={<Town />} />
          <Route path="/worlds" element={<Worlds />} />
          <Route path="/world/:worldId" element={<WorldMap />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/trophies" element={<Trophies />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/play/:worldId/:nodeId" element={<Play />} />
        <Route path="/review" element={<Review />} />
        <Route path="/edit-character" element={<Creator edit />} />
        <Route path="/create" element={<Creator />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="*" element={<Navigate to="/town" replace />} />
      </Routes>
    );
  }
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      {routes}
      {active && <Celebrations />}
      {active && <SessionGuard />}
    </MotionConfig>
  );
}
