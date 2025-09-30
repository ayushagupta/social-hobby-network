import { useEffect } from 'react';
import { XCircle } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    // Cleanup the timer if the component is unmounted
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-[100] bg-red-600 text-white py-3 px-5 rounded-lg shadow-2xl flex items-center animate-fade-in-down">
      <XCircle className="mr-3" />
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-4 font-bold text-lg leading-none" aria-label="Close">&times;</button>
    </div>
  );
}
