import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/loginPage';
import { SignupPage } from './pages/signupPage';
import landingPage from './pages/landingPage';
import HomePage from './pages/homePage';
import UserPlayground from './pages/userPlayground';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={landingPage} />
        <Route path="/login" Component={LoginPage} />
        <Route path="/signup" Component={SignupPage} />
        <Route path="/homepage" Component={HomePage} />
        <Route path="/playground/:id" Component={UserPlayground} />
      </Routes>
    </Router>
  );
};

export default App;
