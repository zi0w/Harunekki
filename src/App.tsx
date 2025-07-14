import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { ROUTES } from './constants/routes';

function App() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
    </Routes>
  );
}

export default App;
