import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import ToolsPage from './ToolsPage';
import UsersPage from './UsersPage';
import LoginPage from './LoginPage';
import NotFound from '../components/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: 'tools', element: <ToolsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
