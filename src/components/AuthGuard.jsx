import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../auth';
import LoadingSpinner from './LoadingSpinner';

export default function AuthGuard({ children }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) return <LoadingSpinner />;
  return children;
}
