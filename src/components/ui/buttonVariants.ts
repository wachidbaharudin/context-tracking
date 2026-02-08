import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: The main CTA - stands out clearly
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm font-semibold',
        // Secondary: Important but not the main action
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500',
        // Ghost: Subtle, appears on interaction - de-emphasized by default
        ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500',
        // Danger: Destructive actions - subtle until hovered
        danger: 'text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:ring-red-500',
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
