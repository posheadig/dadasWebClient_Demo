import * as sepoliaConstants from '../constants/sepolia';
import * as mainConstants from '../constants/main';


export function getConstantsForNetwork(network) {
    switch (network) {
      case 'sepolia':
        return sepoliaConstants;
        case 'main':
          return mainConstants;
      default:
        throw new Error('Invalid network specified.');
    }
  }