import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Box: {
      variants: {
        'stats-card': {
          p: 6,
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
        },
      },
    },
  },
});

export default theme; 