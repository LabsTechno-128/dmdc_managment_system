import { Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { Dashboard } from './pages/Dashboard';

// Mock empty components for routing structure
const Placeholder = ({ title }: { title: string }) => (
    <div className="flex h-full items-center justify-center text-slate-400">
        <h2 className="text-2xl font-semibold">{title} Implementation Pending</h2>
    </div>
);

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Placeholder title="Patients" />} />
        <Route path="/patients/new" element={<Placeholder title="New Patient" />} />
        <Route path="/billing" element={<Placeholder title="Billing" />} />
        <Route path="/billing/new" element={<Placeholder title="New Billing" />} />
        <Route path="/test-counter" element={<Placeholder title="Test Counter" />} />
        <Route path="/reports" element={<Placeholder title="Reports" />} />
        <Route path="/doctors" element={<Placeholder title="Doctors" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Routes>
    </Layout>
  );
}

export default App;
