import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobWithRelations } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type JobCardProps = {
  job: JobWithRelations;
};

export function JobCard({ job }: JobCardProps) {
  const urgencyColor = {
    low: 'border-green-400',
    medium: 'border-yellow-400',
    high: 'border-red-400',
  };

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className={cn("hover:border-primary transition-colors border-l-4", urgencyColor[job.urgency])}>
        <CardHeader>
          <CardTitle className="text-base">{job.customer.name}</CardTitle>
          <CardDescription>{job.device.model}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <p className="text-sm line-clamp-2 text-muted-foreground">{job.description}</p>
            <div className="flex flex-wrap gap-1">
                {job.tags.slice(0, 2).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <span className="font-code">ID: {job.id}</span>
          <span>{formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
