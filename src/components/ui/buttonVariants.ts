import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      },
      size: {
        sm: 'min-h-[44px] px-3 py-2 text-sm md:min-h-0 md:h-8 md:py-0',
        md: 'min-h-[44px] px-3 py-2 text-sm md:min-h-0 md:h-10 md:px-4 md:py-0',
        lg: 'min-h-[44px] px-4 py-2 text-base md:min-h-0 md:h-12 md:px-6 md:py-0',
        icon: 'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-10 md:w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
