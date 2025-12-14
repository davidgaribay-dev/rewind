import { Link } from 'react-router';
import { FileText, Settings } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { Button } from './ui/button';

export function Navbar() {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center px-6 gap-4">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Claude Projects</span>
        </Link>
        <div className="flex-1">
          <Breadcrumbs />
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>
    </nav>
  );
}
