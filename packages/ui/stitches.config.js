import { createStitches } from '@stitches/react';
const baseColors = {
    failure: '#ED4B9E',
    primary: '#1FC7D4',
    primaryBright: '#53DEE9',
    primaryDark: '#0098A1',
    secondary: '#7645D9',
    success: '#31D0AA',
    warning: '#FFB237',
};
const additionalColors = {
    binance: '#F0B90B',
    overlay: '#452a7a',
    gold: '#FFC700',
    silver: '#B2B2B2',
    bronze: '#E7974D',
};
const linearGradient = {
    bubblegum: 'linear-gradient(139.73deg, rgb(229, 253, 255) 0%, rgb(243, 239, 255) 100%)',
};
export const { styled, css, globalCss, keyframes, getCssText, theme, createTheme, config, } = createStitches({
    theme: {
        colors: Object.assign(Object.assign(Object.assign(Object.assign({}, baseColors), additionalColors), { background: '#FAF9FA', backgroundDisabled: '#E9EAEB', backgroundAlt: '#FFFFFF', backgroundAlt2: 'rgba(255, 255, 255, 0.7)', cardBorder: '#E7E3EB', contrast: '#191326', dropdown: '#F6F6F6', dropdownDeep: '#EEEEEE', invertedContrast: '#FFFFFF', input: '#eeeaf4', inputSecondary: '#d7caec', tertiary: '#EFF4F5', text: '#280D5F', textDisabled: '#BDC2C4', textSubtle: '#7A6EAA', disabled: '#E9EAEB' }), linearGradient),
        space: {
            1: '4px',
            2: '8px',
            3: '16px',
            4: '24px',
            5: '32px',
            6: '48px',
            7: '64px',
        },
        radii: {
            small: '4px',
            default: '16px',
            card: '24px',
            circle: '50%',
        },
        zIndices: {
            dropdown: 10,
            modal: 100,
        },
        shadows: {
            level1: '0px 2px 12px -8px rgba(25, 19, 38, 0.1), 0px 1px 1px rgba(25, 19, 38, 0.05)',
            active: '0px 0px 0px 1px #0098A1, 0px 0px 4px 8px rgba(31, 199, 212, 0.4)',
            success: '0px 0px 0px 1px #31D0AA, 0px 0px 0px 4px rgba(49, 208, 170, 0.2)',
            warning: '0px 0px 0px 1px #ED4B9E, 0px 0px 0px 4px rgba(237, 75, 158, 0.2)',
            focus: '0px 0px 0px 1px #7645D9, 0px 0px 0px 4px rgba(118, 69, 217, 0.6)',
            inset: 'inset 0px 2px 2px -1px rgba(74, 74, 104, 0.1)',
            tooltip: '0px 0px 2px rgba(0, 0, 0, 0.2), 0px 4px 12px -8px rgba(14, 14, 44, 0.1)',
        },
        fontSizes: {
            1: '12px',
            2: '14px',
            3: '16px',
            4: '20px',
            5: '24px',
            6: '32px',
            7: '40px',
            8: '64px',
        },
    },
    media: {
        xs: '(min-width: 370px)',
        sm: '(min-width: 576px)',
        md: '(min-width: 852px)',
        lg: '(min-width: 968px)',
        xl: '(min-width: 1080px)',
        xxl: '(min-width: 1200px)',
    },
    utils: {
        p: (value) => ({
            padding: value,
        }),
        pt: (value) => ({
            paddingTop: value,
        }),
        pr: (value) => ({
            paddingRight: value,
        }),
        pb: (value) => ({
            paddingBottom: value,
        }),
        pl: (value) => ({
            paddingLeft: value,
        }),
        px: (value) => ({
            paddingLeft: value,
            paddingRight: value,
        }),
        py: (value) => ({
            paddingTop: value,
            paddingBottom: value,
        }),
        m: (value) => ({
            margin: value,
        }),
        mt: (value) => ({
            marginTop: value,
        }),
        mr: (value) => ({
            marginRight: value,
        }),
        mb: (value) => ({
            marginBottom: value,
        }),
        ml: (value) => ({
            marginLeft: value,
        }),
        mx: (value) => ({
            marginLeft: value,
            marginRight: value,
        }),
        my: (value) => ({
            marginTop: value,
            marginBottom: value,
        }),
        ta: (value) => ({
            textAlign: value,
        }),
        fd: (value) => ({
            flexDirection: value,
        }),
        fw: (value) => ({
            flexWrap: value,
        }),
        ai: (value) => ({
            alignItems: value,
        }),
        ac: (value) => ({
            alignContent: value,
        }),
        jc: (value) => ({
            justifyContent: value,
        }),
        as: (value) => ({
            alignSelf: value,
        }),
        fg: (value) => ({
            flexGrow: value,
        }),
        fs: (value) => ({
            flexShrink: value,
        }),
        fb: (value) => ({
            flexBasis: value,
        }),
        bc: (value) => ({
            backgroundColor: value,
        }),
        br: (value) => ({
            borderRadius: value,
        }),
        btrr: (value) => ({
            borderTopRightRadius: value,
        }),
        bbrr: (value) => ({
            borderBottomRightRadius: value,
        }),
        bblr: (value) => ({
            borderBottomLeftRadius: value,
        }),
        btlr: (value) => ({
            borderTopLeftRadius: value,
        }),
        bs: (value) => ({
            boxShadow: value,
        }),
        lh: (value) => ({
            lineHeight: value,
        }),
        ox: (value) => ({
            overflowX: value,
        }),
        oy: (value) => ({
            overflowY: value,
        }),
        pe: (value) => ({
            pointerEvents: value,
        }),
        us: (value) => ({
            WebkitUserSelect: value,
            userSelect: value,
        }),
        userSelect: (value) => ({
            WebkitUserSelect: value,
            userSelect: value,
        }),
        size: (value) => ({
            width: value,
            height: value,
        }),
        appearance: (value) => ({
            WebkitAppearance: value,
            appearance: value,
        }),
        backgroundClip: (value) => ({
            WebkitBackgroundClip: value,
            backgroundClip: value,
        }),
    },
});
