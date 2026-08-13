const pinataConfig = {
  jwt: process.env.PINATA_JWT || '',
  gatewayUrl: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud',
  pinningEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  unpinEndpoint: 'https://api.pinata.cloud/pinning/unpin'
};

module.exports = pinataConfig;
