import { Target, Calendar, ArrowRight } from 'lucide-react';
import { buildUrl } from '../../lib/utils';

export function DiscoverButton({ className = "" }: { className?: string }) {
  return (
    <a href={buildUrl('practice')}>
      <button
        className={`bg-white hover:bg-primary text-primary hover:text-white border-2 border-primary px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 transition-colors group ${className}`}
      >
        <Target className="w-5 h-5 mr-2 inline" />
        Discover What You're Practicing™
        <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
      </button>
    </a>
  );
}

export function ScheduleButton({ className = "" }: { className?: string }) {
  return (
    <a href={buildUrl('schedule')}>
      <button
        className={`bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-8 py-6 text-base font-semibold rounded-xl ${className}`}
      >
        <Calendar className="w-5 h-5 mr-2 inline" />
        Schedule a LEAP Strategy Call
      </button>
    </a>
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

