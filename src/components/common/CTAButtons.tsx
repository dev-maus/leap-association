import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { buildUrl } from '../../lib/utils';

export function DiscoverButton({ className = "" }: { className?: string }) {
  return (
    <Button href={buildUrl('practice')} variant="secondary" size="lg" className={`group bg-white text-primary hover:bg-primary hover:text-white border-2 border-primary ${className}`}>
      <span>Discover What You're Practicing™</span>
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </Button>
  );
}

export function ScheduleButton({ className = "" }: { className?: string }) {
  return (
    <Button href={buildUrl('schedule')} variant="primary" size="lg" className={`group bg-primary text-white hover:bg-white hover:text-primary border-2 border-primary ${className}`}>
      <Calendar className="w-5 h-5" />
      <span>Schedule a Strategy Call</span>
    </Button>
  );
}

export default function CTAButtons({ className = "" }: { className?: string }) {
  return (
    <>
      <DiscoverButton className={className} />
      <ScheduleButton className={className} />
    </>
  );
}
