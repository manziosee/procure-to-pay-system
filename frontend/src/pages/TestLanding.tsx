import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TestLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">Welcome to Procure-to-Pay System</h1>
        <p className="text-xl text-muted-foreground">
          Streamline your procurement process with intelligent automation
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}