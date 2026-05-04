import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
  );
};

export const TableRowSkeleton = () => (
  <tr className="border-b border-slate-50">
    <td className="px-8 py-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </td>
    <td className="px-6 py-5"><Skeleton className="w-20 h-4" /></td>
    <td className="px-6 py-5"><Skeleton className="w-24 h-4" /></td>
    <td className="px-6 py-5">
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-12 h-6 rounded-full" />
      </div>
    </td>
    <td className="px-6 py-5"><div className="flex justify-end gap-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="w-8 h-8 rounded-lg" /></div></td>
  </tr>
);
