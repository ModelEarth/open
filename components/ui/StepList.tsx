import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

type StepListProps = React.PropsWithChildren & {
  className?: string;
};

export function StepList(props: StepListProps) {
  return <ol className={clsx('list-none', props.className)}>{props.children}</ol>;
}

type StepListItemProps = {
  completed?: boolean;
  current?: boolean;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
};

export function StepListItem(props: StepListItemProps) {
  return (
    <li className={clsx('mb-6 flex cursor-default items-start gap-3 last:mb-0', props.className)}>
      <span>
        <StepListItemIcon {...props} />
      </span>
      <div className="flex flex-col overflow-hidden">
        <span
          className={clsx('flex-wrap overflow-hidden text-ellipsis text-sm font-medium leading-5', {
            'text-oc-blue-tints-800': props.current,
            'text-slate-700': !props.current,
          })}
        >
          {props.title}
        </span>
        <span className="flex-wrap overflow-hidden text-ellipsis text-sm font-normal leading-[18px] text-oc-blue-tints-800">
          {props.subtitle}
        </span>
      </div>
    </li>
  );
}

type StepListItemIconProps = {
  completed?: boolean;
  current?: boolean;
};

export function StepListItemIcon(props: StepListItemIconProps) {
  if (props.current) {
    return (
      <div className="h-[1em] w-[1em] rounded-full bg-oc-blue-tints-transparent p-[.25em]">
        <div className="h-[.5em] w-[.5em] rounded-full bg-oc-blue-tints-800" />
      </div>
    );
  }

  if (props.completed) {
    return (
      <span className="inline-block h-[1em] w-[1em] rounded-full bg-oc-blue-tints-800 p-[.125em] text-white">
        <Check size="0.75em" />
      </span>
    );
  }

  return <div className="m-[.25em] h-[.5em] w-[.5em] rounded-full bg-slate-300" />;
}
