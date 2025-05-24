import { createTheme } from '@mui/material/styles';

// High-contrast theme optimized for operations environments
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
      light: '#6effff',
      dark: '#00b2cc',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff9100',
      light: '#ffc246',
      dark: '#c56200',
      contrastText: '#000000',
    },
    error: {
      main: '#ff1744',
      light: '#ff616f',
      dark: '#c4001d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffea00',
      light: '#ffff56',
      dark: '#c7b800',
      contrastText: '#000000',
    },
    info: {
      main: '#2979ff',
      light: '#75a7ff',
      dark: '#004ecb',
      contrastText: '#ffffff',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 0 8px 2px rgba(0, 229, 255, 0.5)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 0 8px 2px rgba(255, 145, 0, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#1e1e1e',
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.3),0px 1px 1px 0px rgba(0,0,0,0.24),0px 1px 3px 0px rgba(0,0,0,0.22)',
    '0px 3px 1px -2px rgba(0,0,0,0.3),0px 2px 2px 0px rgba(0,0,0,0.24),0px 1px 5px 0px rgba(0,0,0,0.22)',
    '0px 3px 3px -2px rgba(0,0,0,0.3),0px 3px 4px 0px rgba(0,0,0,0.24),0px 1px 8px 0px rgba(0,0,0,0.22)',
    '0px 2px 4px -1px rgba(0,0,0,0.3),0px 4px 5px 0px rgba(0,0,0,0.24),0px 1px 10px 0px rgba(0,0,0,0.22)',
    '0px 3px 5px -1px rgba(0,0,0,0.3),0px 5px 8px 0px rgba(0,0,0,0.24),0px 1px 14px 0px rgba(0,0,0,0.22)',
    '0px 3px 5px -1px rgba(0,0,0,0.3),0px 6px 10px 0px rgba(0,0,0,0.24),0px 1px 18px 0px rgba(0,0,0,0.22)',
    '0px 4px 5px -2px rgba(0,0,0,0.3),0px 7px 10px 1px rgba(0,0,0,0.24),0px 2px 16px 1px rgba(0,0,0,0.22)',
    '0px 5px 5px -3px rgba(0,0,0,0.3),0px 8px 10px 1px rgba(0,0,0,0.24),0px 3px 14px 2px rgba(0,0,0,0.22)',
    '0px 5px 6px -3px rgba(0,0,0,0.3),0px 9px 12px 1px rgba(0,0,0,0.24),0px 3px 16px 2px rgba(0,0,0,0.22)',
    '0px 6px 6px -3px rgba(0,0,0,0.3),0px 10px 14px 1px rgba(0,0,0,0.24),0px 4px 18px 3px rgba(0,0,0,0.22)',
    '0px 6px 7px -4px rgba(0,0,0,0.3),0px 11px 15px 1px rgba(0,0,0,0.24),0px 4px 20px 3px rgba(0,0,0,0.22)',
    '0px 7px 8px -4px rgba(0,0,0,0.3),0px 12px 17px 2px rgba(0,0,0,0.24),0px 5px 22px 4px rgba(0,0,0,0.22)',
    '0px 7px 8px -4px rgba(0,0,0,0.3),0px 13px 19px 2px rgba(0,0,0,0.24),0px 5px 24px 4px rgba(0,0,0,0.22)',
    '0px 7px 9px -4px rgba(0,0,0,0.3),0px 14px 21px 2px rgba(0,0,0,0.24),0px 5px 26px 4px rgba(0,0,0,0.22)',
    '0px 8px 9px -5px rgba(0,0,0,0.3),0px 15px 22px 2px rgba(0,0,0,0.24),0px 6px 28px 5px rgba(0,0,0,0.22)',
    '0px 8px 10px -5px rgba(0,0,0,0.3),0px 16px 24px 2px rgba(0,0,0,0.24),0px 6px 30px 5px rgba(0,0,0,0.22)',
    '0px 8px 11px -5px rgba(0,0,0,0.3),0px 17px 26px 2px rgba(0,0,0,0.24),0px 6px 32px 5px rgba(0,0,0,0.22)',
    '0px 9px 11px -5px rgba(0,0,0,0.3),0px 18px 28px 2px rgba(0,0,0,0.24),0px 7px 34px 6px rgba(0,0,0,0.22)',
    '0px 9px 12px -6px rgba(0,0,0,0.3),0px 19px 29px 2px rgba(0,0,0,0.24),0px 7px 36px 6px rgba(0,0,0,0.22)',
    '0px 10px 13px -6px rgba(0,0,0,0.3),0px 20px 31px 3px rgba(0,0,0,0.24),0px 8px 38px 7px rgba(0,0,0,0.22)',
    '0px 10px 13px -6px rgba(0,0,0,0.3),0px 21px 33px 3px rgba(0,0,0,0.24),0px 8px 40px 7px rgba(0,0,0,0.22)',
    '0px 10px 14px -6px rgba(0,0,0,0.3),0px 22px 35px 3px rgba(0,0,0,0.24),0px 8px 42px 7px rgba(0,0,0,0.22)',
    '0px 11px 14px -7px rgba(0,0,0,0.3),0px 23px 36px 3px rgba(0,0,0,0.24),0px 9px 44px 8px rgba(0,0,0,0.22)',
    '0px 11px 15px -7px rgba(0,0,0,0.3),0px 24px 38px 3px rgba(0,0,0,0.24),0px 9px 46px 8px rgba(0,0,0,0.22)',
  ],
});
