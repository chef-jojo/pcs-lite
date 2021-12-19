import { styled } from '../stitches.config';
export const Button = styled('button', {
    // Reset
    all: 'unset',
    alignItems: 'center',
    boxSizing: 'border-box',
    userSelect: 'none',
    '&::before': {
        boxSizing: 'border-box',
    },
    '&::after': {
        boxSizing: 'border-box',
    },
    // Custom reset?
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    lineHeight: '1',
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    boxShadow: '0px -1px 0px 0px rgba(14, 14, 44, 0.4) inset',
    // Custom
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.03em',
    borderRadius: '$default',
    fontVariantNumeric: 'tabular-nums',
    transition: 'background-color 0.2s, opacity 0.2s',
    '&:disabled': {
        backgroundColor: '$backgroundDisabled',
        borderColor: '$backgroundDisabled',
        boxShadow: 'none',
        color: '$textDisabled',
        cursor: 'not-allowed',
    },
    '&:active': {
        opacity: 0.85,
        boxShadow: 'none',
        transform: 'translateY(1px)',
    },
    '&:hover': {
        opacity: 0.65,
    },
    variants: {
        size: {
            xs: {
                height: '20px',
                px: '8px',
                fontSize: '$1',
            },
            sm: {
                height: '32px',
                px: '16px',
                fontSize: '$2',
            },
            md: {
                height: '48px',
                px: '24px',
                fontSize: '$3',
            },
        },
        variant: {
            primary: {
                backgroundColor: '$primary',
                color: 'white',
            },
            secondary: {
                backgroundColor: 'transparent',
                border: '2px solid',
                borderColor: '$primary',
                boxShadow: 'none',
                color: '$primary',
                ':disabled': {
                    backgroundColor: 'transparent',
                },
            },
            tertiary: {
                backgroundColor: '$tertiary',
                boxShadow: 'none',
                color: '$primary',
            },
            subtle: {
                backgroundColor: '$textSubtle',
                color: '$backgroundAlt',
            },
            danger: {
                backgroundColor: '$failure',
                color: 'white',
            },
            success: {
                backgroundColor: '$success',
                color: 'white',
            },
            text: {
                backgroundColor: 'transparent',
                color: '$primary',
                boxShadow: 'none',
            },
            light: {
                backgroundColor: '$input',
                color: '$textSubtle',
                boxShadow: 'none',
            },
        },
        state: {
            loading: {
                opacity: 0.5,
            },
        },
    },
    defaultVariants: {
        size: 'md',
        variant: 'primary',
    },
});
