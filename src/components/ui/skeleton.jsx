import React from 'react';
import { cn } from '@/lib/utils';

const Skeleton = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('skeleton rounded-md bg-white/10', className)}
    {...props}
  />
));

Skeleton.displayName = 'Skeleton';

export { Skeleton };


