import { Github, Youtube, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center mt-6 pb-4">
      <div className="flex items-center space-x-4">
        <a 
          href="https://github.com/debloper/rshn" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="GitHub Repository"
        >
          <Github size={16} />
        </a>
        <a 
          href="https://youtube.com/@BreakerSpace" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-red-400 transition-colors"
          aria-label="YouTube Channel"
        >
          <Youtube size={16} />
        </a>
        <a 
          href="https://instagram.com/BreakerSpace" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-pink-400 transition-colors"
          aria-label="Instagram Profile"
        >
          <Instagram size={16} />
        </a>
      </div>
    </footer>
  );
}
