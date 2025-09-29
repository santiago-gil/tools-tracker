import { Link } from 'react-router-dom';
import { Button } from './Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">
        Sorry, the page you are looking for could not be found.
      </p>
      <Link to="/tools">
        <Button variant="primary">Go to Tools</Button>
      </Link>
    </div>
  );
}
