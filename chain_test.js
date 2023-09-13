const testChain = {
  chain: [
    {
      index: 1,
      timestamp: 1692695854380,
      data: [],
      nonce: 1,
      hash: 'Genisis',
      previousHash: 'Genisis',
    },
    {
      index: 2,
      timestamp: 1692695939579,
      data: [],
      nonce: 3984,
      hash: '00001d3ecd4ffb6ec47ecfb450d4628f7e77dff75149734aa69e0b9575c23032',
      previousHash: 'Genisis',
    },
    {
      index: 3,
      timestamp: 1692695997765,
      data: [
        {
          item: 'eggs',
          quantity: 6,
          transactionId: '9ebaed1d4c934d73834e1aacdc61bb12',
        },
        {
          item: 'milk',
          quantity: 2,
          transactionId: 'fbe9587e1d9c4383b43c0c47c06e539b',
        },

      ],
      nonce: 44543,
      hash: '0000d16bc4af60cf5a1e66882a31223c9c66d811391f8ca13a5bd063ecc60607',
      previousHash: '00001d3ecd4ffb6ec47ecfb450d4628f7e77dff75149734aa69e0b9575c23032',
    },
  ],
  pendingList: [
    {
      item: 'eggs',
      quantity: 6,
      transactionId: 'd627f7e2fc074a17974c667c3956418c',
    },
    
  ],
  nodeUrl: 'http://localhost:3000',
  networkNodes: ['http://localhost:3001'],
};

console.log('Är korrekt: ', groceryList.validateChain(testChain.chain));

