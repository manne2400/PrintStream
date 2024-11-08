import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ 
  config,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Box: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      }),
      variants: {
        'stats-card': (props: any) => ({
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          borderRadius: 'lg',
          p: 6,
          shadow: 'sm'
        })
      }
    },
    Container: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      }),
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        }
      }),
    },
    CardBody: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      }),
    },
    CardHeader: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      }),
    },
    Chart: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
        borderRadius: 'lg',
        p: 4,
      }),
    },
    Table: {
      variants: {
        simple: (props: any) => ({
          th: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
            color: props.colorMode === 'dark' ? 'white' : 'gray.600',
          },
          td: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
            color: props.colorMode === 'dark' ? 'white' : 'gray.800',
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          },
        }),
      },
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        },
      }),
    },
    Input: {
      variants: {
        outline: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'white',
            },
          },
        }),
      },
    },
    Select: {
      variants: {
        outline: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          },
        }),
      },
    },
    Textarea: {
      variants: {
        outline: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          },
        }),
      },
    },
  },
  colors: {
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
  },
});

export default theme; 