import { Platform } from 'react-native';

const styles = {
  container: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 3.5,
      },
      default: {
        boxShadow: '0px 2px 3.5px rgba(0, 0, 0, 0.2)', // Web and Android
      },
    }),
  },
};
